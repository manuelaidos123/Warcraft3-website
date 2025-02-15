<?php
declare(strict_types=1);

class DatabaseConfig {
    private const DEFAULT_CONFIG = [
        'host' => 'localhost',
        'user' => 'default_user',
        'pass' => 'default_pass',
        'name' => 'warcraft3_db'
    ];
    
    public static function getConfig(): array {
        return [
            'host' => getenv('DB_HOST') ?: self::DEFAULT_CONFIG['host'],
            'user' => getenv('DB_USER') ?: self::DEFAULT_CONFIG['user'],
            'pass' => getenv('DB_PASS') ?: self::DEFAULT_CONFIG['pass'],
            'name' => getenv('DB_NAME') ?: self::DEFAULT_CONFIG['name']
        ];
    }
    
    public static function getConnection(): mysqli {
        $config = self::getConfig();
        
        try {
            $conn = new mysqli(
                $config['host'],
                $config['user'],
                $config['pass'],
                $config['name']
            );
            
            if ($conn->connect_error) {
                throw new Exception("Database connection failed: " . $conn->connect_error);
            }
            
            $conn->set_charset("utf8mb4");
            return $conn;
        } catch (Exception $e) {
            error_log($e->getMessage());
            throw $e;
        }
    }
}

// Usage example:
try {
    $conn = DatabaseConfig::getConnection();
    // Use connection...
} catch (Exception $e) {
    // Handle error...
}
?>
