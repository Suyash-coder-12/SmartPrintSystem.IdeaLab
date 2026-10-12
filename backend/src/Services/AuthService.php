<?php

namespace SmartPrint\Services;

class AuthService
{
    private string $secret;
    private int $ttl;

    public function __construct()
    {
        $appConfig = require dirname(__DIR__, 2) . '/config/app.php';
        $this->secret = $appConfig['jwt_secret'];
        $this->ttl = $appConfig['jwt_ttl'];
    }

    public function generateToken(array $payload): string
    {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload['iat'] = time();
        $payload['exp'] = time() + $this->ttl;
        $payloadJson = json_encode($payload);

        $base64Header = $this->base64UrlEncode($header);
        $base64Payload = $this->base64UrlEncode($payloadJson);

        $signature = hash_hmac('sha256', "$base64Header.$base64Payload", $this->secret, true);
        $base64Signature = $this->base64UrlEncode($signature);

        return "$base64Header.$base64Payload.$base64Signature";
    }

    public function verifyToken(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$base64Header, $base64Payload, $base64Signature] = $parts;

        $validSignature = hash_hmac('sha256', "$base64Header.$base64Payload", $this->secret, true);
        $validBase64Signature = $this->base64UrlEncode($validSignature);

        if (!hash_equals($validBase64Signature, $base64Signature)) {
            return null;
        }

        $payload = json_decode($this->base64UrlDecode($base64Payload), true);
        if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
            return null;
        }

        return $payload;
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
