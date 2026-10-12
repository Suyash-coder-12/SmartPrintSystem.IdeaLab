<?php

spl_autoload_register(function ($class) {
    $prefix = 'SmartPrint\\';
    $baseDir = dirname(__DIR__) . '/src/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    if (file_exists($file)) {
        require $file;
    }
});

use SmartPrint\Middleware\CorsMiddleware;
use SmartPrint\Controllers\AuthController;
use SmartPrint\Controllers\SuperAdminController;
use SmartPrint\Controllers\XeroxCenterController;
use SmartPrint\Controllers\CustomerPrintController;
use SmartPrint\Controllers\PrintAgentController;

CorsMiddleware::handle();

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Normalize URI (strip query and trailing slashes)
$uri = rtrim($uri, '/');
if (empty($uri)) {
    $uri = '/';
}

// Health check root
if ($uri === '' || $uri === '/' || $uri === '/api' || $uri === '/api/health') {
    echo json_encode([
        'status' => 'online',
        'service' => 'SmartPrint Management System API',
        'version' => '1.0.0',
        'architecture' => 'Enterprise PHP API + Local Print Agent Connector',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit;
}

try {
    // 1. Auth routes
    if ($uri === '/api/auth/login' && $method === 'POST') {
        (new AuthController())->login();
        exit;
    }
    if ($uri === '/api/auth/register' && $method === 'POST') {
        (new AuthController())->register();
        exit;
    }
    if ($uri === '/api/auth/me' && $method === 'GET') {
        (new AuthController())->me();
        exit;
    }
    if ($uri === '/api/auth/profile' && ($method === 'POST' || $method === 'PUT')) {
        (new AuthController())->updateProfile();
        exit;
    }
    if ($uri === '/api/auth/change-password' && $method === 'POST') {
        (new AuthController())->changePassword();
        exit;
    }

    // 2. Super Admin routes
    if ($uri === '/api/superadmin/stats' && $method === 'GET') {
        (new SuperAdminController())->getDashboardStats();
        exit;
    }
    if ($uri === '/api/superadmin/users' && $method === 'GET') {
        (new SuperAdminController())->listUsersDetails();
        exit;
    }
    if (preg_match('#^/api/superadmin/centers/([^/]+)/status$#', $uri, $m) && ($method === 'PUT' || $method === 'POST')) {
        (new SuperAdminController())->updateCenterStatus($m[1]);
        exit;
    }
    if ($uri === '/api/superadmin/subscriptions' && $method === 'GET') {
        (new SuperAdminController())->getSubscriptions();
        exit;
    }
    if ($uri === '/api/superadmin/subscriptions' && $method === 'POST') {
        (new SuperAdminController())->createSubscription();
        exit;
    }
    if (preg_match('#^/api/superadmin/subscriptions/([^/]+)$#', $uri, $m)) {
        if ($method === 'PUT' || $method === 'POST') {
            (new SuperAdminController())->updateSubscription($m[1]);
            exit;
        }
        if ($method === 'DELETE') {
            (new SuperAdminController())->deleteSubscription($m[1]);
            exit;
        }
    }

    // 3. Xerox Center Vendor routes
    if ($uri === '/api/center/dashboard' && $method === 'GET') {
        (new XeroxCenterController())->getDashboard();
        exit;
    }
    if ($uri === '/api/center/profile' && $method === 'GET') {
        (new XeroxCenterController())->getProfileAndQR();
        exit;
    }
    if ($uri === '/api/center/pricing' && ($method === 'PUT' || $method === 'POST')) {
        (new XeroxCenterController())->updatePricingSettings();
        exit;
    }
    if ($uri === '/api/center/printers' && $method === 'GET') {
        (new XeroxCenterController())->listPrinters();
        exit;
    }
    if ($uri === '/api/center/printers' && $method === 'POST') {
        (new XeroxCenterController())->addPrinter();
        exit;
    }
    if (preg_match('#^/api/center/printers/([^/]+)$#', $uri, $m) && ($method === 'PUT' || $method === 'POST')) {
        (new XeroxCenterController())->updatePrinter($m[1]);
        exit;
    }
    if ($uri === '/api/center/queue' && $method === 'GET') {
        (new XeroxCenterController())->getQueue();
        exit;
    }
    if (preg_match('#^/api/center/jobs/([^/]+)/status$#', $uri, $m) && ($method === 'PUT' || $method === 'POST')) {
        (new XeroxCenterController())->updateJobStatus($m[1]);
        exit;
    }
    if ($uri === '/api/center/history' && $method === 'GET') {
        (new XeroxCenterController())->getHistory();
        exit;
    }
    if ($uri === '/api/center/analytics' && $method === 'GET') {
        (new XeroxCenterController())->getAnalytics();
        exit;
    }

    // 4. Customer Self-Service routes (8-Step flow)
    if (preg_match('#^/api/customer/center/([^/]+)$#', $uri, $m) && $method === 'GET') {
        (new CustomerPrintController())->getCenterByCode($m[1]);
        exit;
    }
    if ($uri === '/api/customer/upload' && $method === 'POST') {
        (new CustomerPrintController())->uploadDocument();
        exit;
    }
    if ($uri === '/api/customer/calculate-price' && $method === 'POST') {
        (new CustomerPrintController())->calculatePrice();
        exit;
    }
    if ($uri === '/api/customer/create-order' && $method === 'POST') {
        (new CustomerPrintController())->createPaymentOrder();
        exit;
    }
    if ($uri === '/api/customer/verify-payment' && $method === 'POST') {
        (new CustomerPrintController())->verifyPaymentAndQueueJob();
        exit;
    }
    if (preg_match('#^/api/customer/job-status/([^/]+)$#', $uri, $m) && $method === 'GET') {
        (new CustomerPrintController())->getJobStatus($m[1]);
        exit;
    }

    // 5. Print Agent routes
    if ($uri === '/api/agent/handshake' && $method === 'POST') {
        (new PrintAgentController())->handshake();
        exit;
    }
    if ($uri === '/api/agent/jobs' && $method === 'GET') {
        (new PrintAgentController())->getPendingJobs();
        exit;
    }
    if ($uri === '/api/agent/update-status' && $method === 'POST') {
        (new PrintAgentController())->updatePrintStatus();
        exit;
    }
    if ($uri === '/api/system/auto-trash' && $method === 'POST') {
        (new PrintAgentController())->triggerAutoTrash();
        exit;
    }

    http_response_code(404);
    echo json_encode(['success' => false, 'message' => "Route not found: $method $uri"]);
} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Internal server error: ' . $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
