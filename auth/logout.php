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
use App\Security\Cookie;
use App\Http\Response;

// Initialize secure session handler
$session = new Session();
$session->start();

// Initialize response handler
$response = new Response();

try {
    // Clear session securely
    $session->destroy();

    // Clear remember me cookie if it exists using secure cookie handler
    $cookie = new Cookie();
    if ($cookie->exists('remember_token')) {
        $cookie->delete('remember_token', [
            'path' => '/',
            'secure' => true,
            'httponly' => true,
            'samesite' => 'Strict'
        ]);
    }

    // Redirect using response handler with absolute path
    $response->redirect('/index.html');
    return;
    
} catch (\Exception $e) {
    error_log("Logout error: " . $e->getMessage());
    $response->redirect('/error.html');
    return;
}
?>
