<?php
session_start();

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    
    // Define Mock Shop Admins with unique Shop IDs
    $mock_shops = [
        'admin' => ['password' => 'admin123', 'shop_id' => 'SHOP_1234', 'name' => 'City Print Hub'],
        'admin2' => ['password' => 'admin123', 'shop_id' => 'SHOP_9999', 'name' => 'Quick Xerox']
    ];

    // Super Admin Credentials
    if ($username === 'superadmin' && $password === 'luckystrike123') {
        $_SESSION['user_type'] = 'superadmin';
        $_SESSION['logged_in'] = true;
        header('Location: http://luckystrike.localhost:8000');
        exit;
    }
    // Shop Admin Credentials
    elseif (array_key_exists($username, $mock_shops) && $mock_shops[$username]['password'] === $password) {
        $_SESSION['user_type'] = 'shopadmin';
        $_SESSION['logged_in'] = true;
        $_SESSION['shop_id'] = $mock_shops[$username]['shop_id'];
        $_SESSION['shop_name'] = $mock_shops[$username]['name'];
        header('Location: http://admin.localhost:8000');
        exit;
    } else {
        $error = 'Invalid credentials!';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login | Smart Print</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            overflow: hidden;
        }
        .login-box {
            width: 100%;
            max-width: 400px;
            padding: 40px;
            text-align: center;
            animation: slideUpFade 0.6s ease forwards;
        }
        .login-box h2 {
            font-size: 28px;
            font-weight: 800;
            margin-bottom: 30px;
            color: var(--primary);
        }
        .input-group {
            margin-bottom: 20px;
            text-align: left;
        }
        .input-group label {
            display: block;
            margin-bottom: 8px;
            font-size: 14px;
            font-weight: 600;
            color: var(--text-muted);
        }
        .glass-input {
            width: 100%;
            padding: 15px;
            border-radius: 20px;
            border: 1px solid var(--liquid-border);
            background: rgba(255, 255, 255, 0.6);
            outline: none;
            transition: all 0.3s ease;
            font-family: inherit;
            font-size: 16px;
            box-sizing: border-box;
        }
        .glass-input:focus {
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.3);
            background: rgba(255, 255, 255, 0.9);
        }
        .btn-primary {
            width: 100%;
            padding: 15px;
            font-size: 16px;
            margin-top: 10px;
        }
        .error-msg {
            color: #ef4444;
            background: rgba(239, 68, 68, 0.1);
            padding: 10px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-weight: 600;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="login-box glass-panel">
        <h2>Smart Print Login</h2>
        
        <?php if ($error): ?>
            <div class="error-msg"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>

        <form method="POST" action="">
            <div class="input-group">
                <label>Username</label>
                <input type="text" name="username" class="glass-input" required placeholder="Enter your username">
            </div>
            
            <div class="input-group">
                <label>Password</label>
                <input type="password" name="password" class="glass-input" required placeholder="Enter your password">
            </div>
            
            <button type="submit" class="btn-primary" style="animation: pulseGlow 2s infinite;">Login to Dashboard</button>
        </form>
        
        <p style="margin-top: 20px; font-size: 14px; color: var(--text-muted);">
            End users can access <a href="http://user.localhost:8000" style="color: var(--primary); text-decoration: none; font-weight: 700;">user.localhost:8000</a> without login.
        </p>
    </div>
</body>
</html>
