<?php

namespace SmartPrint\Controllers;

use SmartPrint\Services\DatabaseService;
use SmartPrint\Middleware\AuthMiddleware;

class XeroxCenterController
{
    private DatabaseService $db;

    public function __construct()
    {
        $this->db = DatabaseService::getInstance();
    }

    private function getAuthedCenter(): array
    {
        $userSession = AuthMiddleware::authenticate('center');
        $center = $this->db->findOne('centers', ['user_id' => $userSession['id']]);
        if (!$center) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Xerox center profile not found for this user']);
            exit;
        }
        return $center;
    }

    public function getDashboard(): void
    {
        $center = $this->getAuthedCenter();
        $centerId = $center['id'];

        $printers = $this->db->findMany('printers', ['center_id' => $centerId]);
        $allJobs = $this->db->findMany('print_jobs', ['center_id' => $centerId]);
        $transactions = $this->db->findMany('transactions', ['center_id' => $centerId]);
        $subscription = $this->db->findOne('subscriptions', ['id' => $center['subscription_plan_id'] ?? 'sub_pro']);

        // Queue jobs: queued or printing
        $queueJobs = array_filter($allJobs, function ($j) {
            return in_array($j['job_status'], ['queued', 'printing', 'spooling']);
        });

        // Today's metrics
        $today = date('Y-m-d');
        $todayRevenue = 0;
        $todayJobsCount = 0;
        foreach ($allJobs as $job) {
            if (str_starts_with($job['created_at'], $today)) {
                $todayJobsCount++;
                if (($job['payment_status'] ?? '') === 'paid') {
                    $todayRevenue += (float)($job['total_amount'] ?? 0);
                }
            }
        }

        echo json_encode([
            'success' => true,
            'center' => $center,
            'subscription' => $subscription,
            'metrics' => [
                'today_revenue' => round($todayRevenue, 2),
                'today_jobs' => $todayJobsCount,
                'queue_count' => count($queueJobs),
                'active_printers' => count(array_filter($printers, fn($p) => $p['status'] === 'online')),
                'total_printers' => count($printers)
            ],
            'printers' => $printers,
            'queue' => array_values($queueJobs),
            'recent_history' => array_slice(array_reverse($allJobs), 0, 5)
        ]);
    }

    public function getProfileAndQR(): void
    {
        $center = $this->getAuthedCenter();
        $subscription = $this->db->findOne('subscriptions', ['id' => $center['subscription_plan_id'] ?? '']);

        echo json_encode([
            'success' => true,
            'profile' => [
                'center_id' => $center['id'],
                'center_code' => $center['center_code'],
                'center_name' => $center['name'],
                'owner_name' => $center['owner_name'],
                'email' => $center['email'],
                'contact_no' => $center['contact_no'],
                'address' => $center['address'],
                'qr_url' => $center['qr_code_url'],
                'qr_target_payload' => [
                    'app' => 'SmartPrint',
                    'code' => $center['center_code'],
                    'name' => $center['name'],
                    'direct_url' => "http://localhost:5173/print/{$center['center_code']}"
                ],
                'pricing' => [
                    'bw_price' => (float)$center['bw_price'],
                    'color_price' => (float)$center['color_price'],
                    'duplex_multiplier' => (float)$center['duplex_multiplier'],
                    'a3_surcharge' => (float)$center['a3_surcharge'],
                    'legal_surcharge' => (float)$center['legal_surcharge']
                ],
                'subscription' => $subscription
            ]
        ]);
    }

    public function updatePricingSettings(): void
    {
        $center = $this->getAuthedCenter();
        $input = json_decode(file_get_contents('php://input'), true) ?: [];

        $update = [];
        if (isset($input['bw_price'])) $update['bw_price'] = (float)$input['bw_price'];
        if (isset($input['color_price'])) $update['color_price'] = (float)$input['color_price'];
        if (isset($input['duplex_multiplier'])) $update['duplex_multiplier'] = (float)$input['duplex_multiplier'];
        if (isset($input['a3_surcharge'])) $update['a3_surcharge'] = (float)$input['a3_surcharge'];
        if (isset($input['legal_surcharge'])) $update['legal_surcharge'] = (float)$input['legal_surcharge'];

        $this->db->update('centers', ['id' => $center['id']], $update);

        echo json_encode([
            'success' => true,
            'message' => 'Print pricing settings updated successfully',
            'pricing' => array_merge($center, $update)
        ]);
    }

    public function listPrinters(): void
    {
        $center = $this->getAuthedCenter();
        $printers = $this->db->findMany('printers', ['center_id' => $center['id']]);
        echo json_encode(['success' => true, 'printers' => $printers]);
    }

    public function addPrinter(): void
    {
        $center = $this->getAuthedCenter();
        $input = json_decode(file_get_contents('php://input'), true) ?: [];

        $name = trim($input['name'] ?? '');
        if (empty($name)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Printer name required']);
            return;
        }

        $printer = [
            'id' => 'prn_' . bin2hex(random_bytes(4)),
            'center_id' => $center['id'],
            'name' => $name,
            'model' => $input['model'] ?? 'Standard Laser/Inkjet',
            'type' => $input['type'] ?? 'bw',
            'status' => 'online',
            'paper_level' => (int)($input['paper_level'] ?? 100),
            'ink_level' => (int)($input['ink_level'] ?? 100),
            'supported_sizes' => $input['supported_sizes'] ?? 'A4,A3,Legal',
            'created_at' => date('Y-m-d H:i:s')
        ];

        $this->db->insert('printers', $printer);
        echo json_encode(['success' => true, 'message' => 'Printer added', 'printer' => $printer]);
    }

    public function updatePrinter(string $printerId): void
    {
        $center = $this->getAuthedCenter();
        $input = json_decode(file_get_contents('php://input'), true) ?: [];

        $update = [];
        if (isset($input['name'])) $update['name'] = trim($input['name']);
        if (isset($input['status'])) $update['status'] = $input['status'];
        if (isset($input['paper_level'])) $update['paper_level'] = (int)$input['paper_level'];
        if (isset($input['ink_level'])) $update['ink_level'] = (int)$input['ink_level'];

        $this->db->update('printers', ['id' => $printerId, 'center_id' => $center['id']], $update);
        echo json_encode(['success' => true, 'message' => 'Printer updated']);
    }

    public function getQueue(): void
    {
        $center = $this->getAuthedCenter();
        $jobs = $this->db->findMany('print_jobs', ['center_id' => $center['id']]);

        $queue = array_values(array_filter($jobs, function ($j) {
            return in_array($j['job_status'], ['queued', 'spooling', 'printing']);
        }));

        echo json_encode(['success' => true, 'queue' => $queue]);
    }

    public function updateJobStatus(string $jobId): void
    {
        $center = $this->getAuthedCenter();
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $status = $input['status'] ?? 'completed';

        $this->db->update('print_jobs', ['id' => $jobId, 'center_id' => $center['id']], [
            'job_status' => $status,
            'updated_at' => date('Y-m-d H:i:s')
        ]);

        echo json_encode(['success' => true, 'message' => "Job status updated to $status"]);
    }

    public function getHistory(): void
    {
        $center = $this->getAuthedCenter();
        $jobs = $this->db->findMany('print_jobs', ['center_id' => $center['id']]);
        echo json_encode(['success' => true, 'history' => array_reverse($jobs)]);
    }

    public function getAnalytics(): void
    {
        $center = $this->getAuthedCenter();
        $jobs = $this->db->findMany('print_jobs', ['center_id' => $center['id']]);

        // Synthesize 3-month monthly revenue and daily data for rich charts
        $monthlyData = [
            ['month' => 'Month 1', 'revenue' => 14200, 'jobs' => 840, 'bw' => 650, 'color' => 190],
            ['month' => 'Month 2', 'revenue' => 18950, 'jobs' => 1120, 'bw' => 890, 'color' => 230],
            ['month' => 'Month 3 (Current)', 'revenue' => 24100, 'jobs' => 1480, 'bw' => 1140, 'color' => 340],
        ];

        // Also calculate live real-time job breakdown
        $bwCount = 0;
        $colorCount = 0;
        $totalRev = 0;
        foreach ($jobs as $job) {
            if (($job['payment_status'] ?? '') === 'paid') {
                $totalRev += (float)($job['total_amount'] ?? 0);
                if (($job['color_mode'] ?? 'bw') === 'color') {
                    $colorCount++;
                } else {
                    $bwCount++;
                }
            }
        }

        echo json_encode([
            'success' => true,
            'three_month_revenue' => $monthlyData,
            'distribution' => [
                'bw_jobs' => $bwCount,
                'color_jobs' => $colorCount,
                'live_total_revenue' => round($totalRev, 2)
            ]
        ]);
    }
}
