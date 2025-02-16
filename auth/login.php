<?php
declare(strict_types=1);

namespace App\Auth;

// Use a more secure way to define paths
use App\Config\PathConfig;
use App\Bootstrap\AppBootstrap;

// Initialize application with secure bootstrapping
try {
    $bootstrap = new AppBootstrap();
    $bootstrap->initialize();
} catch (\Exception $e) {
    http_response_code(500);
    error_log('Critical: Bootstrap initialization failed: ' . $e->getMessage());
    throw new \RuntimeException('Application initialization failed');
}

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
    return;
}

// Validate CSRF token
if (!CSRF::validateToken($request->getHeader('X-CSRF-Token'))) {
    $response->sendError('Invalid CSRF token', 403);
    return;
}

// Validate and sanitize input
$validator = new InputValidator();

try {
    $username = $validator->sanitizeUsername($request->getPost('username'));
    $password = $validator->sanitizePassword($request->getPost('password'));
    $remember = $validator->validateBoolean($request->getPost('remember', false));
} catch (ValidationException $e) {
    $response->sendError($e->getMessage(), 400);
    return;
}

// Validate required fields
if (empty($username) || empty($password)) {
    $response->sendError('Username and password are required', 400);
    return;
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
        return;
    }
    
    $response->sendError('Invalid credentials', 401);
    return;
    
} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    $response->sendError('An error occurred during authentication', 500);
    return;
}
?>
