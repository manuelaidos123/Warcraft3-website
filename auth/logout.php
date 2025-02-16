<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

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

    // Redirect using response handler
    $response->redirect('../index.html');
} catch (Exception $e) {
    error_log("Logout error: " . $e->getMessage());
    $response->redirect('../error.html');
}
?>
