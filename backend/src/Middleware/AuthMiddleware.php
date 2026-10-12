<?php

namespace SmartPrint\Middleware;

use SmartPrint\Services\AuthService;

class AuthMiddleware
{
    public static function authenticate(?string $requiredRole = null): ?array
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (!preg_match('/Bearer\s+(\S+)/', $authHeader, $matches)) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized: Missing or invalid token']);
            exit;
        }

        $token = $matches[1];
        $authService = new AuthService();
        $user = $authService->verifyToken($token);

        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized: Token expired or invalid']);
            exit;
        }

        if ($requiredRole && $user['role'] !== $requiredRole) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Forbidden: Insufficient privileges']);
            exit;
        }

        return $user;
    }
}
