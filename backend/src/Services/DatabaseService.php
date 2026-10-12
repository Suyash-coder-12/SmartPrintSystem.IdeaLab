<?php

namespace SmartPrint\Services;

class DatabaseService
{
    private static ?DatabaseService $instance = null;
    private ?\PDO $pdo = null;
    private string $jsonPath;
    private array $inMemoryData = [];
    private bool $isSqlite = false;

    private function __construct()
    {
        $dbConfig = require dirname(__DIR__, 2) . '/config/database.php';
        $dbDir = dirname(__DIR__, 2) . '/storage/db';
        $uploadDir = dirname(__DIR__, 2) . '/storage/uploads';

        if (!is_dir($dbDir)) {
            mkdir($dbDir, 0777, true);
        }
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $sqlitePath = $dbConfig['connections']['sqlite']['database'];
        $this->jsonPath = $dbConfig['connections']['json_fallback']['path'];

        if (extension_loaded('pdo_sqlite')) {
            try {
                $this->pdo = new \PDO("sqlite:" . $sqlitePath);
                $this->pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
                $this->pdo->setAttribute(\PDO::ATTR_DEFAULT_FETCH_MODE, \PDO::FETCH_ASSOC);
                $this->isSqlite = true;
                $this->initSqliteTables();
            } catch (\Exception $e) {
                $this->isSqlite = false;
            }
        }

        if (!$this->isSqlite) {
            $this->initJsonStorage();
        }

        $this->seedInitialData();
    }

    public static function getInstance(): DatabaseService
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function initSqliteTables(): void
    {
        $queries = [
            "CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                role TEXT NOT NULL,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                contact_no TEXT,
                status TEXT DEFAULT 'active',
                created_at TEXT
            )",
            "CREATE TABLE IF NOT EXISTS centers (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                center_code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                owner_name TEXT NOT NULL,
                email TEXT NOT NULL,
                contact_no TEXT NOT NULL,
                address TEXT,
                qr_code_url TEXT,
                bw_price REAL DEFAULT 2.0,
                color_price REAL DEFAULT 10.0,
                duplex_multiplier REAL DEFAULT 1.8,
                a3_surcharge REAL DEFAULT 5.0,
                legal_surcharge REAL DEFAULT 2.0,
                status TEXT DEFAULT 'active',
                subscription_plan_id TEXT,
                subscription_expires_at TEXT,
                created_at TEXT
            )",
            "CREATE TABLE IF NOT EXISTS printers (
                id TEXT PRIMARY KEY,
                center_id TEXT NOT NULL,
                name TEXT NOT NULL,
                model TEXT,
                type TEXT,
                status TEXT DEFAULT 'online',
                paper_level INTEGER DEFAULT 100,
                ink_level INTEGER DEFAULT 100,
                supported_sizes TEXT,
                created_at TEXT
            )",
            "CREATE TABLE IF NOT EXISTS print_jobs (
                id TEXT PRIMARY KEY,
                center_id TEXT NOT NULL,
                customer_name TEXT NOT NULL,
                customer_phone TEXT,
                document_name TEXT NOT NULL,
                file_path TEXT,
                file_size_kb INTEGER,
                compressed_size_kb INTEGER,
                page_count INTEGER NOT NULL,
                pages_to_print TEXT DEFAULT 'all',
                color_mode TEXT DEFAULT 'bw',
                paper_size TEXT DEFAULT 'A4',
                duplex_mode TEXT DEFAULT 'single',
                copies INTEGER DEFAULT 1,
                total_amount REAL NOT NULL,
                payment_id TEXT,
                payment_status TEXT DEFAULT 'pending',
                job_status TEXT DEFAULT 'queued',
                job_token TEXT UNIQUE NOT NULL,
                assigned_printer_id TEXT,
                retention_hours INTEGER DEFAULT 24,
                trashed_at TEXT,
                created_at TEXT,
                updated_at TEXT
            )",
            "CREATE TABLE IF NOT EXISTS subscriptions (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                price REAL NOT NULL,
                billing_cycle TEXT DEFAULT 'monthly',
                printer_limit INTEGER DEFAULT 1,
                max_jobs INTEGER DEFAULT 1000,
                has_analytics INTEGER DEFAULT 1,
                has_agent INTEGER DEFAULT 1,
                offers_text TEXT,
                is_active INTEGER DEFAULT 1,
                created_at TEXT
            )",
            "CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY,
                job_id TEXT,
                center_id TEXT NOT NULL,
                razorpay_order_id TEXT,
                razorpay_payment_id TEXT,
                amount REAL NOT NULL,
                currency TEXT DEFAULT 'INR',
                status TEXT DEFAULT 'success',
                customer_phone TEXT,
                created_at TEXT
            )"
        ];

        foreach ($queries as $sql) {
            $this->pdo->exec($sql);
        }
    }

    private function initJsonStorage(): void
    {
        if (file_exists($this->jsonPath)) {
            $json = file_get_contents($this->jsonPath);
            $this->inMemoryData = json_decode($json, true) ?: [];
        } else {
            $this->inMemoryData = [
                'users' => [],
                'centers' => [],
                'printers' => [],
                'print_jobs' => [],
                'subscriptions' => [],
                'transactions' => []
            ];
            $this->persistJson();
        }
    }

    private function persistJson(): void
    {
        file_put_contents($this->jsonPath, json_encode($this->inMemoryData, JSON_PRETTY_PRINT));
    }

    private function seedInitialData(): void
    {
        $existingAdmin = $this->findOne('users', ['email' => 'admin@smartprint.com']);
        if ($existingAdmin) {
            return;
        }

        // 1. Super Admin
        $this->insert('users', [
            'id' => 'usr_admin_01',
            'role' => 'superadmin',
            'name' => 'Super Administrator',
            'email' => 'admin@smartprint.com',
            'password_hash' => password_hash('admin123', PASSWORD_BCRYPT),
            'contact_no' => '+91 9876543210',
            'status' => 'active',
            'created_at' => date('Y-m-d H:i:s')
        ]);

        // 2. Xerox Center 1 User 
        // Idea is to have two centers with different subsciption plans and different print jobs for testing analytics.
        $this->insert('users', [
            'id' => 'usr_center_01',
            'role' => 'center',
            'name' => 'Aniket Chavhan',
            'email' => 'center@quickprint.com',
            'password_hash' => password_hash('center123', PASSWORD_BCRYPT),
            'contact_no' => '+91 8999876543',
            'status' => 'active',
            'created_at' => date('Y-m-d H:i:s')
        ]);

        // 2b. Xerox Center 2 User
        $this->insert('users', [
            'id' => 'usr_center_02',
            'role' => 'center',
            'name' => 'Pavan Londhe',
            'email' => 'delhi@apexprint.in',
            'password_hash' => password_hash('center123', PASSWORD_BCRYPT),
            'contact_no' => '+91 9123456780',
            'status' => 'active',
            'created_at' => date('Y-m-d H:i:s')
        ]);

        // 3. Subscriptions Setup
        $sub1 = [
            'id' => 'sub_starter',
            'name' => 'Starter Vendor',
            'price' => 499.0,
            'billing_cycle' => 'monthly',
            'printer_limit' => 1,
            'max_jobs' => 500,
            'has_analytics' => 1,
            'has_agent' => 1,
            'offers_text' => 'Introductory 15% off first month',
            'is_active' => 1,
            'created_at' => date('Y-m-d H:i:s')
        ];
        $sub2 = [
            'id' => 'sub_pro',
            'name' => 'Pro Xerox Hub',
            'price' => 999.0,
            'billing_cycle' => 'monthly',
            'printer_limit' => 4,
            'max_jobs' => 5000,
            'has_analytics' => 1,
            'has_agent' => 1,
            'offers_text' => 'Most Popular: Free QR Acrylic Standee kit',
            'is_active' => 1,
            'created_at' => date('Y-m-d H:i:s')
        ];
        $sub3 = [
            'id' => 'sub_enterprise',
            'name' => 'Enterprise Campus Network',
            'price' => 1999.0,
            'billing_cycle' => 'monthly',
            'printer_limit' => 20,
            'max_jobs' => 50000,
            'has_analytics' => 1,
            'has_agent' => 1,
            'offers_text' => 'Dedicated SLA + 24/7 Agent Monitoring',
            'is_active' => 1,
            'created_at' => date('Y-m-d H:i:s')
        ];
        $this->insert('subscriptions', $sub1);
        $this->insert('subscriptions', $sub2);
        $this->insert('subscriptions', $sub3);

        // 4. Center profiles
        $this->insert('centers', [
            'id' => 'cnt_01',
            'user_id' => 'usr_center_01',
            'center_code' => 'XC-89412',
            'name' => 'QuickPrint Xerox & Digital Hub',
            'owner_name' => 'Vikram Sharma',
            'email' => 'center@quickprint.com',
            'contact_no' => '+91 9823456789',
            'address' => 'Shop 14, Metro Pillar 218, University North Campus',
            'qr_code_url' => 'https://smartprint.local/print/XC-89412',
            'bw_price' => 2.0,
            'color_price' => 10.0,
            'duplex_multiplier' => 1.8,
            'a3_surcharge' => 5.0,
            'legal_surcharge' => 2.0,
            'status' => 'active',
            'subscription_plan_id' => 'sub_pro',
            'subscription_expires_at' => date('Y-m-d H:i:s', strtotime('+45 days')),
            'created_at' => date('Y-m-d H:i:s')
        ]);

        $this->insert('centers', [
            'id' => 'cnt_02',
            'user_id' => 'usr_center_02',
            'center_code' => 'XC-44218',
            'name' => 'Apex Campus Xerox Center',
            'owner_name' => 'Rajesh Gupta',
            'email' => 'delhi@apexprint.in',
            'contact_no' => '+91 9123456780',
            'address' => 'Gate 2, Engineering College Complex, South City',
            'qr_code_url' => 'https://smartprint.local/print/XC-44218',
            'bw_price' => 2.5,
            'color_price' => 12.0,
            'duplex_multiplier' => 1.75,
            'a3_surcharge' => 6.0,
            'legal_surcharge' => 2.5,
            'status' => 'active',
            'subscription_plan_id' => 'sub_starter',
            'subscription_expires_at' => date('Y-m-d H:i:s', strtotime('+20 days')),
            'created_at' => date('Y-m-d H:i:s')
        ]);

        // 5. Printers for Center 1
        $this->insert('printers', [
            'id' => 'prn_01',
            'center_id' => 'cnt_01',
            'name' => 'HP LaserJet Pro M404dn',
            'model' => 'LaserJet HighSpeed Network',
            'type' => 'bw',
            'status' => 'online',
            'paper_level' => 88,
            'ink_level' => 92,
            'supported_sizes' => 'A4,A3,Legal',
            'created_at' => date('Y-m-d H:i:s')
        ]);
        $this->insert('printers', [
            'id' => 'prn_02',
            'center_id' => 'cnt_01',
            'name' => 'Canon imageRUNNER 2625',
            'model' => 'Heavy Duty Multi-Function',
            'type' => 'color',
            'status' => 'online',
            'paper_level' => 74,
            'ink_level' => 65,
            'supported_sizes' => 'A4,A3,Letter,Legal',
            'created_at' => date('Y-m-d H:i:s')
        ]);
        $this->insert('printers', [
            'id' => 'prn_03',
            'center_id' => 'cnt_01',
            'name' => 'Epson EcoTank L3250 Wi-Fi',
            'model' => 'Photo & Document Color',
            'type' => 'color',
            'status' => 'online',
            'paper_level' => 95,
            'ink_level' => 80,
            'supported_sizes' => 'A4,Letter',
            'created_at' => date('Y-m-d H:i:s')
        ]);

        // 6. Seed Sample Print Jobs & Revenue for 3-Month Analytics
        $sampleJobs = [
            [
                'id' => 'job_seed_01',
                'center_id' => 'cnt_01',
                'customer_name' => 'Aarav Patel',
                'customer_phone' => '+91 9876112233',
                'document_name' => 'Final_Year_Project_Synopsis.pdf',
                'file_size_kb' => 2450,
                'compressed_size_kb' => 940,
                'page_count' => 16,
                'pages_to_print' => 'all',
                'color_mode' => 'bw',
                'paper_size' => 'A4',
                'duplex_mode' => 'duplex',
                'copies' => 2,
                'total_amount' => 57.6,
                'payment_id' => 'pay_rzp_demo_101',
                'payment_status' => 'paid',
                'job_status' => 'queued',
                'job_token' => 'SP-8421',
                'assigned_printer_id' => 'prn_01',
                'retention_hours' => 24,
                'created_at' => date('Y-m-d H:i:s', strtotime('-15 minutes')),
                'updated_at' => date('Y-m-d H:i:s')
            ],
            [
                'id' => 'job_seed_02',
                'center_id' => 'cnt_01',
                'customer_name' => 'Sneha Verma',
                'customer_phone' => '+91 9765432190',
                'document_name' => 'Aadhar_Card_Color_FrontBack.pdf',
                'file_size_kb' => 1100,
                'compressed_size_kb' => 450,
                'page_count' => 2,
                'pages_to_print' => 'all',
                'color_mode' => 'color',
                'paper_size' => 'A4',
                'duplex_mode' => 'single',
                'copies' => 1,
                'total_amount' => 20.0,
                'payment_id' => 'pay_rzp_demo_102',
                'payment_status' => 'paid',
                'job_status' => 'printing',
                'job_token' => 'SP-3910',
                'assigned_printer_id' => 'prn_02',
                'retention_hours' => 24,
                'created_at' => date('Y-m-d H:i:s', strtotime('-40 minutes')),
                'updated_at' => date('Y-m-d H:i:s')
            ],
            [
                'id' => 'job_seed_03',
                'center_id' => 'cnt_01',
                'customer_name' => 'Rohit Mehra',
                'customer_phone' => '+91 9845123456',
                'document_name' => 'Company_BalanceSheet_2026.pdf',
                'file_size_kb' => 4800,
                'compressed_size_kb' => 1820,
                'page_count' => 45,
                'pages_to_print' => 'all',
                'color_mode' => 'bw',
                'paper_size' => 'A4',
                'duplex_mode' => 'duplex',
                'copies' => 3,
                'total_amount' => 243.0,
                'payment_id' => 'pay_rzp_demo_103',
                'payment_status' => 'paid',
                'job_status' => 'completed',
                'job_token' => 'SP-7712',
                'assigned_printer_id' => 'prn_01',
                'retention_hours' => 24,
                'created_at' => date('Y-m-d H:i:s', strtotime('-2 hours')),
                'updated_at' => date('Y-m-d H:i:s')
            ]
        ];

        foreach ($sampleJobs as $job) {
            $this->insert('print_jobs', $job);
            $this->insert('transactions', [
                'id' => 'tx_' . $job['id'],
                'job_id' => $job['id'],
                'center_id' => $job['center_id'],
                'razorpay_order_id' => 'order_' . substr($job['payment_id'], 4),
                'razorpay_payment_id' => $job['payment_id'],
                'amount' => $job['total_amount'],
                'currency' => 'INR',
                'status' => 'success',
                'customer_phone' => $job['customer_phone'],
                'created_at' => $job['created_at']
            ]);
        }
    }

    public function findOne(string $table, array $where): ?array
    {
        if ($this->isSqlite) {
            $clauses = [];
            $params = [];
            foreach ($where as $key => $val) {
                $clauses[] = "$key = ?";
                $params[] = $val;
            }
            $sql = "SELECT * FROM $table WHERE " . implode(' AND ', $clauses) . " LIMIT 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $row = $stmt->fetch();
            return $row ?: null;
        }

        if (!isset($this->inMemoryData[$table])) {
            return null;
        }

        foreach ($this->inMemoryData[$table] as $item) {
            $match = true;
            foreach ($where as $k => $v) {
                if (!isset($item[$k]) || $item[$k] !== $v) {
                    $match = false;
                    break;
                }
            }
            if ($match) {
                return $item;
            }
        }
        return null;
    }

    public function findMany(string $table, array $where = [], string $orderBy = '', int $limit = 0): array
    {
        if ($this->isSqlite) {
            $sql = "SELECT * FROM $table";
            $params = [];
            if (!empty($where)) {
                $clauses = [];
                foreach ($where as $key => $val) {
                    $clauses[] = "$key = ?";
                    $params[] = $val;
                }
                $sql .= " WHERE " . implode(' AND ', $clauses);
            }
            if ($orderBy) {
                $sql .= " ORDER BY $orderBy";
            }
            if ($limit > 0) {
                $sql .= " LIMIT $limit";
            }
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll() ?: [];
        }

        if (!isset($this->inMemoryData[$table])) {
            return [];
        }

        $results = [];
        foreach ($this->inMemoryData[$table] as $item) {
            $match = true;
            foreach ($where as $k => $v) {
                if (!isset($item[$k]) || $item[$k] !== $v) {
                    $match = false;
                    break;
                }
            }
            if ($match) {
                $results[] = $item;
            }
        }

        if ($limit > 0) {
            $results = array_slice($results, 0, $limit);
        }

        return $results;
    }

    public function insert(string $table, array $data): bool
    {
        if ($this->isSqlite) {
            $keys = array_keys($data);
            $fields = implode(', ', $keys);
            $placeholders = implode(', ', array_fill(0, count($keys), '?'));
            $sql = "INSERT INTO $table ($fields) VALUES ($placeholders)";
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute(array_values($data));
        }

        if (!isset($this->inMemoryData[$table])) {
            $this->inMemoryData[$table] = [];
        }
        $this->inMemoryData[$table][] = $data;
        $this->persistJson();
        return true;
    }

    public function update(string $table, array $where, array $data): bool
    {
        if ($this->isSqlite) {
            $setParts = [];
            $params = [];
            foreach ($data as $k => $v) {
                $setParts[] = "$k = ?";
                $params[] = $v;
            }
            $whereParts = [];
            foreach ($where as $k => $v) {
                $whereParts[] = "$k = ?";
                $params[] = $v;
            }
            $sql = "UPDATE $table SET " . implode(', ', $setParts) . " WHERE " . implode(' AND ', $whereParts);
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute($params);
        }

        if (!isset($this->inMemoryData[$table])) {
            return false;
        }

        $updated = false;
        foreach ($this->inMemoryData[$table] as $idx => $item) {
            $match = true;
            foreach ($where as $k => $v) {
                if (!isset($item[$k]) || $item[$k] !== $v) {
                    $match = false;
                    break;
                }
            }
            if ($match) {
                $this->inMemoryData[$table][$idx] = array_merge($item, $data);
                $updated = true;
            }
        }
        if ($updated) {
            $this->persistJson();
        }
        return $updated;
    }

    public function delete(string $table, array $where): bool
    {
        if ($this->isSqlite) {
            $whereParts = [];
            $params = [];
            foreach ($where as $k => $v) {
                $whereParts[] = "$k = ?";
                $params[] = $v;
            }
            $sql = "DELETE FROM $table WHERE " . implode(' AND ', $whereParts);
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute($params);
        }

        if (!isset($this->inMemoryData[$table])) {
            return false;
        }

        $originalCount = count($this->inMemoryData[$table]);
        $this->inMemoryData[$table] = array_filter($this->inMemoryData[$table], function ($item) use ($where) {
            foreach ($where as $k => $v) {
                if (isset($item[$k]) && $item[$k] === $v) {
                    return false;
                }
            }
            return true;
        });
        $this->inMemoryData[$table] = array_values($this->inMemoryData[$table]);
        $this->persistJson();
        return count($this->inMemoryData[$table]) < $originalCount;
    }

    public function queryRaw(string $sql, array $params = []): array
    {
        if ($this->isSqlite) {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll() ?: [];
        }
        return [];
    }
}
