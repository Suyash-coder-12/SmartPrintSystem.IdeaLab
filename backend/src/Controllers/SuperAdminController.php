<?php

namespace SmartPrint\Controllers;

use SmartPrint\Services\DatabaseService;
use SmartPrint\Middleware\AuthMiddleware;

class SuperAdminController
{
    private DatabaseService $db;

    public function __construct()
    {
        $this->db = DatabaseService::getInstance();
    }

    public function getDashboardStats(): void
    {
        AuthMiddleware::authenticate('superadmin');

        $centers = $this->db->findMany('centers');
        $printers = $this->db->findMany('printers');
        $jobs = $this->db->findMany('print_jobs');
        $subscriptions = $this->db->findMany('subscriptions');
        $transactions = $this->db->findMany('transactions');

        $totalRevenue = 0;
        foreach ($transactions as $tx) {
            $totalRevenue += (float)($tx['amount'] ?? 0);
        }

        $activeCenters = 0;
        foreach ($centers as $c) {
            if (($c['status'] ?? 'active') === 'active') {
                $activeCenters++;
            }
        }

        $activePrinters = 0;
        foreach ($printers as $p) {
            if (($p['status'] ?? 'online') === 'online') {
                $activePrinters++;
            }
        }

        echo json_encode([
            'success' => true,
            'stats' => [
                'total_centers' => count($centers),
                'active_centers' => $activeCenters,
                'total_printers' => count($printers),
                'active_printers' => $activePrinters,
                'total_jobs' => count($jobs),
                'platform_revenue' => round($totalRevenue, 2),
                'active_subscriptions' => count($subscriptions)
            ],
            'recent_centers' => array_slice(array_reverse($centers), 0, 5),
            'recent_jobs' => array_slice(array_reverse($jobs), 0, 5)
        ]);
    }

    public function listUsersDetails(): void
    {
        AuthMiddleware::authenticate('superadmin');

        $query = strtolower(trim($_GET['q'] ?? ''));
        $statusFilter = $_GET['status'] ?? 'all';

        $centers = $this->db->findMany('centers');
        $users = $this->db->findMany('users');

        $userMap = [];
        foreach ($users as $u) {
            $userMap[$u['id']] = $u;
        }

        $enrichedCenters = [];
        foreach ($centers as $c) {
            $owner = $userMap[$c['user_id']] ?? null;
            $status = $c['status'] ?? 'active';

            if ($statusFilter !== 'all' && $status !== $statusFilter) {
                continue;
            }

            if (!empty($query)) {
                $match = str_contains(strtolower($c['name']), $query)
                    || str_contains(strtolower($c['email']), $query)
                    || str_contains(strtolower($c['center_code']), $query)
                    || str_contains(strtolower($c['owner_name']), $query);
                if (!$match) {
                    continue;
                }
            }

            // Count jobs for this center
            $jobs = $this->db->findMany('print_jobs', ['center_id' => $c['id']]);
            $c['total_jobs_count'] = count($jobs);
            $c['owner_details'] = $owner ? [
                'name' => $owner['name'],
                'email' => $owner['email'],
                'contact_no' => $owner['contact_no']
            ] : null;

            $enrichedCenters[] = $c;
        }

        echo json_encode([
            'success' => true,
            'centers' => $enrichedCenters
        ]);
    }

    public function updateCenterStatus(string $centerId): void
    {
        AuthMiddleware::authenticate('superadmin');
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $status = $input['status'] ?? 'active';

        $center = $this->db->findOne('centers', ['id' => $centerId]);
        if (!$center) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Center not found']);
            return;
        }

        $this->db->update('centers', ['id' => $centerId], ['status' => $status]);
        // Also update user status
        $this->db->update('users', ['id' => $center['user_id']], ['status' => $status]);

        echo json_encode([
            'success' => true,
            'message' => "Center status updated to $status"
        ]);
    }

    public function getSubscriptions(): void
    {
        AuthMiddleware::authenticate('superadmin');
        $plans = $this->db->findMany('subscriptions');

        // Annotate subscriber count
        $centers = $this->db->findMany('centers');
        foreach ($plans as &$plan) {
            $subscribers = 0;
            foreach ($centers as $c) {
                if (($c['subscription_plan_id'] ?? '') === $plan['id']) {
                    $subscribers++;
                }
            }
            $plan['subscribers_count'] = $subscribers;
        }

        echo json_encode(['success' => true, 'subscriptions' => $plans]);
    }

    public function createSubscription(): void
    {
        AuthMiddleware::authenticate('superadmin');
        $input = json_decode(file_get_contents('php://input'), true) ?: [];

        $name = trim($input['name'] ?? '');
        $price = (float)($input['price'] ?? 0);

        if (empty($name) || $price <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Plan name and positive price required']);
            return;
        }

        $id = 'sub_' . bin2hex(random_bytes(4));
        $plan = [
            'id' => $id,
            'name' => $name,
            'price' => $price,
            'billing_cycle' => $input['billing_cycle'] ?? 'monthly',
            'printer_limit' => (int)($input['printer_limit'] ?? 1),
            'max_jobs' => (int)($input['max_jobs'] ?? 1000),
            'has_analytics' => !empty($input['has_analytics']) ? 1 : 0,
            'has_agent' => !empty($input['has_agent']) ? 1 : 0,
            'offers_text' => $input['offers_text'] ?? '',
            'is_active' => 1,
            'created_at' => date('Y-m-d H:i:s')
        ];

        $this->db->insert('subscriptions', $plan);
        echo json_encode(['success' => true, 'message' => 'Subscription plan created', 'plan' => $plan]);
    }

    public function updateSubscription(string $id): void
    {
        AuthMiddleware::authenticate('superadmin');
        $input = json_decode(file_get_contents('php://input'), true) ?: [];

        $updateData = [];
        if (isset($input['name'])) $updateData['name'] = trim($input['name']);
        if (isset($input['price'])) $updateData['price'] = (float)$input['price'];
        if (isset($input['printer_limit'])) $updateData['printer_limit'] = (int)$input['printer_limit'];
        if (isset($input['max_jobs'])) $updateData['max_jobs'] = (int)$input['max_jobs'];
        if (isset($input['offers_text'])) $updateData['offers_text'] = trim($input['offers_text']);
        if (isset($input['is_active'])) $updateData['is_active'] = $input['is_active'] ? 1 : 0;

        $this->db->update('subscriptions', ['id' => $id], $updateData);
        echo json_encode(['success' => true, 'message' => 'Subscription plan updated']);
    }

    public function deleteSubscription(string $id): void
    {
        AuthMiddleware::authenticate('superadmin');
        $this->db->delete('subscriptions', ['id' => $id]);
        echo json_encode(['success' => true, 'message' => 'Subscription plan deleted']);
    }
}
