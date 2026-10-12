<?php

return [
    'name' => 'SmartPrint Management System API',
    'version' => '1.0.0',
    'env' => 'production',
    'jwt_secret' => 'smartprint_super_secret_jwt_key_2026_xcd9120',
    'jwt_ttl' => 86400 * 7, // 7 days
    'upload_dir' => dirname(__DIR__) . '/storage/uploads',
    'db_dir' => dirname(__DIR__) . '/storage/db',
    'allowed_origins' => [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
        'http://localhost:8080'
    ]
];
