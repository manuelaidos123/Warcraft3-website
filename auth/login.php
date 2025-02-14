<?php
session_start();
require_once '../config/database.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';
$remember = isset($_POST['remember']) ? true : false;

if (empty($username) || empty($password)) {
    echo json_encode(['error' => 'Username and password are required']);
    exit;
}

$conn = getDBConnection();

// Prepare statement to prevent SQL injection
$stmt = $conn->prepare("SELECT id, username, password FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    
    if (password_verify($password, $user['password'])) {
        // Login successful
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        
        // Handle remember me
        if ($remember) {
            $token = bin2hex(random_bytes(32));
            $stmt = $conn->prepare("UPDATE users SET remember_token = ? WHERE id = ?");
            $stmt->bind_param("si", $token, $user['id']);
            $stmt->execute();
            
            // Set cookie for 30 days
            setcookie('remember_token', $token, time() + (86400 * 30), "/");
        }
        
        // Update last login
        $stmt = $conn->prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?");
        $stmt->bind_param("i", $user['id']);
        $stmt->execute();
        
        echo json_encode(['success' => true, 'message' => 'Login successful']);
    } else {
        echo json_encode(['error' => 'Invalid credentials']);
    }
} else {
    echo json_encode(['error' => 'Invalid credentials']);
}

$stmt->close();
$conn->close();
?>