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
} catch (Exception $e) {
    error_log("Logout error: " . $e->getMessage());
    $response->redirect('/error.html');
}
?>
