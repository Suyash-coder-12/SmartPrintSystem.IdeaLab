<?php

namespace SmartPrint\Controllers;

use SmartPrint\Services\DatabaseService;
use SmartPrint\Services\AuthService;
use SmartPrint\Middleware\AuthMiddleware;

class AuthController
{
    private DatabaseService $db;
    private AuthService $auth;

    public function __construct()
    {
        $this->db = DatabaseService::getInstance();
        $this->auth = new AuthService();
    }

    public function login(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';

        if (empty($email) || empty($password)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Email and password are required']);
            return;
        }

        $user = $this->db->findOne('users', ['email' => $email]);
        if (!$user || !password_verify($password, $user['password_hash'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Invalid email or password']);
            return;
        }

        if ($user['status'] !== 'active') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Your account is deactivated. Contact admin.']);
            return;
        }

        $center = null;
        if ($user['role'] === 'center') {
            $center = $this->db->findOne('centers', ['user_id' => $user['id']]);
        }

        $payload = [
            'id' => $user['id'],
            'role' => $user['role'],
            'email' => $user['email'],
            'name' => $user['name'],
            'center_id' => $center['id'] ?? null,
            'center_code' => $center['center_code'] ?? null
        ];

        $token = $this->auth->generateToken($payload);

        unset($user['password_hash']);

        echo json_encode([
            'success' => true,
            'token' => $token,
            'user' => $user,
            'center' => $center,
            'message' => 'Login successful'
        ]);
    }

    public function register(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $email = trim($input['email'] ?? '');
        $name = trim($input['name'] ?? '');
        $password = $input['password'] ?? '';
        $role = $input['role'] ?? 'center'; // 'center' or 'customer'
        $centerName = trim($input['center_name'] ?? ($name . ' Xerox'));
        $contactNo = trim($input['contact_no'] ?? '');

        if (empty($email) || empty($password) || empty($name)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Name, email, and password are required']);
            return;
        }

        $existing = $this->db->findOne('users', ['email' => $email]);
        if ($existing) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Email is already registered']);
            return;
        }

        $userId = 'usr_' . bin2hex(random_bytes(6));
        $this->db->insert('users', [
            'id' => $userId,
            'role' => $role,
            'name' => $name,
            'email' => $email,
            'password_hash' => password_hash($password, PASSWORD_BCRYPT),
            'contact_no' => $contactNo,
            'status' => 'active',
            'created_at' => date('Y-m-d H:i:s')
        ]);

        $center = null;
        if ($role === 'center') {
            $centerId = 'cnt_' . bin2hex(random_bytes(4));
            $randomDigits = str_pad((string)rand(10000, 99999), 5, '0', STR_PAD_LEFT);
            $centerCode = 'XC-' . $randomDigits;

            $center = [
                'id' => $centerId,
                'user_id' => $userId,
                'center_code' => $centerCode,
                'name' => $centerName,
                'owner_name' => $name,
                'email' => $email,
                'contact_no' => $contactNo,
                'address' => $input['address'] ?? 'Ground Floor, Main Street',
                'qr_code_url' => 'https://smartprint.local/print/' . $centerCode,
                'bw_price' => 2.0,
                'color_price' => 10.0,
                'duplex_multiplier' => 1.8,
                'a3_surcharge' => 5.0,
                'legal_surcharge' => 2.0,
                'status' => 'active',
                'subscription_plan_id' => 'sub_starter',
                'subscription_expires_at' => date('Y-m-d H:i:s', strtotime('+30 days')),
                'created_at' => date('Y-m-d H:i:s')
            ];
            $this->db->insert('centers', $center);

            // Add default printer
            $this->db->insert('printers', [
                'id' => 'prn_' . bin2hex(random_bytes(4)),
                'center_id' => $centerId,
                'name' => 'Default Multi-Function Printer',
                'model' => 'Standard USB / Network Spooler',
                'type' => 'bw',
                'status' => 'online',
                'paper_level' => 100,
                'ink_level' => 100,
                'supported_sizes' => 'A4,A3,Legal',
                'created_at' => date('Y-m-d H:i:s')
            ]);
        }

        $token = $this->auth->generateToken([
            'id' => $userId,
            'role' => $role,
            'email' => $email,
            'name' => $name,
            'center_id' => $center['id'] ?? null,
            'center_code' => $center['center_code'] ?? null
        ]);

        echo json_encode([
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => $userId,
                'name' => $name,
                'email' => $email,
                'role' => $role,
                'contact_no' => $contactNo
            ],
            'center' => $center,
            'message' => 'Registration successful'
        ]);
    }

    public function me(): void
    {
        $userSession = AuthMiddleware::authenticate();
        $user = $this->db->findOne('users', ['id' => $userSession['id']]);
        if (!$user) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'User not found']);
            return;
        }

        unset($user['password_hash']);
        $center = null;
        if ($user['role'] === 'center') {
            $center = $this->db->findOne('centers', ['user_id' => $user['id']]);
        }

        echo json_encode([
            'success' => true,
            'user' => $user,
            'center' => $center
        ]);
    }

    public function updateProfile(): void
    {
        $userSession = AuthMiddleware::authenticate();
        $input = json_decode(file_get_contents('php://input'), true) ?: [];

        $updateData = [];
        if (isset($input['name'])) $updateData['name'] = trim($input['name']);
        if (isset($input['contact_no'])) $updateData['contact_no'] = trim($input['contact_no']);
        if (isset($input['email'])) $updateData['email'] = trim($input['email']);

        if (!empty($updateData)) {
            $this->db->update('users', ['id' => $userSession['id']], $updateData);
        }

        // Also update center owner info if center
        if ($userSession['role'] === 'center') {
            $centerUpdate = [];
            if (isset($input['name'])) $centerUpdate['owner_name'] = trim($input['name']);
            if (isset($input['center_name'])) $centerUpdate['name'] = trim($input['center_name']);
            if (isset($input['contact_no'])) $centerUpdate['contact_no'] = trim($input['contact_no']);
            if (isset($input['address'])) $centerUpdate['address'] = trim($input['address']);
            if (!empty($centerUpdate)) {
                $this->db->update('centers', ['user_id' => $userSession['id']], $centerUpdate);
            }
        }

        echo json_encode(['success' => true, 'message' => 'Profile updated successfully']);
    }

    public function changePassword(): void
    {
        $userSession = AuthMiddleware::authenticate();
        $input = json_decode(file_get_contents('php://input'), true) ?: [];

        $oldPassword = $input['old_password'] ?? '';
        $newPassword = $input['new_password'] ?? '';

        if (empty($newPassword) || strlen($newPassword) < 6) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'New password must be at least 6 characters']);
            return;
        }

        $user = $this->db->findOne('users', ['id' => $userSession['id']]);
        if (!password_verify($oldPassword, $user['password_hash'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Current password does not match']);
            return;
        }

        $this->db->update('users', ['id' => $userSession['id']], [
            'password_hash' => password_hash($newPassword, PASSWORD_BCRYPT)
        ]);

        echo json_encode(['success' => true, 'message' => 'Password updated successfully']);
    }
}
