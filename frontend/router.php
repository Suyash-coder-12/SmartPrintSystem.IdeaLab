<?php
// router.php - Handles Subdomain Routing and File Serving

// 1. Check if the requested file exists and is not the root
$path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
$file = __DIR__ . $path;

if ($path !== '/' && file_exists($file)) {
    // If it's a PHP file, require it directly (e.g. login.php)
    if (pathinfo($file, PATHINFO_EXTENSION) === 'php') {
        require $file;
        exit;
    }
    // For static assets (CSS, JS, images), return false so PHP server handles it
    return false; 
}

// 2. If it's the root directory (/) or file not found, route based on subdomain
$host = $_SERVER['HTTP_HOST'];

if (strpos($host, 'admin.localhost') === 0) {
    // Xerox Center / Shop Admin
    require 'shop_admin.php';
} elseif (strpos($host, 'luckystrike.localhost') === 0) {
    // Super Admin
    require 'super_admin.php';
} elseif (strpos($host, 'user.localhost') === 0 || strpos($host, 'localhost') === 0) {
    // End User (Customer)
    require 'index.php';
} else {
    // Fallback
    require 'index.php';
}
?>
