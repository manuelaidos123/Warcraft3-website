<?php
// Load configuration from environment variables or secure configuration file
function getDBConfig() {
    return [
        'host' => getenv('DB_HOST') ?: 'localhost',
        'user' => getenv('DB_USER') ?: 'default_user',
        'pass' => getenv('DB_PASS') ?: 'default_pass',
        'name' => getenv('DB_NAME') ?: 'warcraft3_db'
    ];
}

function getDBConnection() {
    $config = getDBConfig();
    $conn = new mysqli(
        $config['host'],
        $config['user'],
        $config['pass'],
        $config['name']
    );
    
    if ($conn->connect_error) {
        error_log("Database connection failed: " . $conn->connect_error);
        throw new Exception("Database connection failed");
    }
    
    $conn->set_charset("utf8mb4");
    return $conn;
}
?>
