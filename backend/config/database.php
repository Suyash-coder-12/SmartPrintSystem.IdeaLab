<?php

return [
    'default' => 'sqlite',
    'connections' => [
        'sqlite' => [
            'database' => dirname(__DIR__) . '/storage/db/smartprint.sqlite',
        ],
        'json_fallback' => [
            'path' => dirname(__DIR__) . '/storage/db/smartprint_data.json',
        ]
    ]
];
