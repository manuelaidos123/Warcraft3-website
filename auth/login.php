<?php
declare(strict_types=1);

namespace App\Auth;

// Use constant for base path
define('BASE_PATH', dirname(__DIR__));

// Secure file inclusion using realpath
$bootstrapPath = realpath(BASE_PATH . '/bootstrap.php');
if ($bootstrapPath === false || !is_file($bootstrapPath)) {
    http_response_code(500);
    error_log('Critical: Bootstrap file not found');
    exit('System configuration error');
}
require_once $bootstrapPath;

use App\Security\Session;
use App\Security\CSRF;
use App\Http\Response;
use App\Http\Request;
use App\Security\InputValidator;
use App\Auth\AuthenticationService;
use App\Security\Cookie;

// Initialize secure session
$session = new Session();
$session->start();

// Initialize response handler
$response = new Response();
$response->setJsonHeader();

// Initialize request handler
$request = new Request();

// Validate request method
if (!$request->isPost()) {
    $response->sendError('Method not allowed', 405);
}

// Validate CSRF token
if (!CSRF::validateToken($request->getHeader('X-CSRF-Token'))) {
    $response->sendError('Invalid CSRF token', 403);
}

// Validate and sanitize input
$validator = new InputValidator();

try {
    $username = $validator->sanitizeUsername($request->getPost('username'));
    $password = $validator->sanitizePassword($request->getPost('password'));
    $remember = $validator->validateBoolean($request->getPost('remember', false));
} catch (ValidationException $e) {
    $response->sendError($e->getMessage(), 400);
}

// Validate required fields
if (empty($username) || empty($password)) {
    $response->sendError('Username and password are required', 400);
}

try {
    // Initialize authentication service
    $auth = new AuthenticationService();
    
    // Attempt login
    $user = $auth->authenticate($username, $password);
    
    if ($user) {
        // Set session data securely
        $session->set('user_id', $user['id']);
        $session->set('username', $user['username']);
        
        // Handle remember me functionality
        if ($remember) {
            $token = $auth->generateRememberToken();
            $auth->storeRememberToken($user['id'], $token);
            
            // Set secure cookie
            Cookie::set([
                'name' => 'remember_token',
                'value' => $token,
                'expire' => time() + (86400 * 30),
                'path' => '/',
                'secure' => true,
                'httponly' => true,
                'samesite' => 'Strict'
            ]);
        }
        
        // Update last login timestamp
        $auth->updateLastLogin($user['id']);
        
        $response->sendSuccess('Login successful');
    } else {
        $response->sendError('Invalid credentials', 401);
    }
} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    $response->sendError('An error occurred during authentication', 500);
}
?>
