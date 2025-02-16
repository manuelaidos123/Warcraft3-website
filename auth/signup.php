<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

use App\Security\Session;
use App\Security\CSRF;
use App\Http\Response;
use App\Http\Request;
use App\Security\InputValidator;
use App\Auth\RegistrationService;
use App\Database\DatabaseConnection;

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

try {
    // Initialize input validator
    $validator = new InputValidator();

    // Validate and sanitize input
    $username = $validator->sanitizeUsername($request->getPost('username'));
    $email = $validator->sanitizeEmail($request->getPost('email'));
    $password = $validator->sanitizePassword($request->getPost('password'));

    // Validate required fields
    if (empty($username) || empty($email) || empty($password)) {
        $response->sendError('All fields are required', 400);
    }

    // Validate email format
    if (!$validator->isValidEmail($email)) {
        $response->sendError('Invalid email format', 400);
    }

    // Validate password strength
    if (!$validator->isValidPassword($password)) {
        $response->sendError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character', 400);
    }

    // Initialize registration service
    $db = DatabaseConnection::getInstance();
    $registrationService = new RegistrationService($db);

    // Check if username or email already exists
    if ($registrationService->isUserExists($username, $email)) {
        $response->sendError('Username or email already exists', 409);
    }

    // Register new user
    $result = $registrationService->registerUser([
        'username' => $username,
        'email' => $email,
        'password' => $password
    ]);

    if ($result) {
        // Log successful registration
        error_log("New user registered: {$username}");
        
        // Send success response
        $response->sendSuccess('Registration successful');
    } else {
        throw new RuntimeException('Registration failed');
    }

} catch (ValidationException $e) {
    error_log("Validation error during registration: " . $e->getMessage());
    $response->sendError($e->getMessage(), 400);
} catch (DatabaseException $e) {
    error_log("Database error during registration: " . $e->getMessage());
    $response->sendError('An error occurred during registration', 500);
} catch (Exception $e) {
    error_log("Unexpected error during registration: " . $e->getMessage());
    $response->sendError('An unexpected error occurred', 500);
}
?>
