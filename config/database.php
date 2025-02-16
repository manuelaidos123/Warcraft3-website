<?php
declare(strict_types=1);

class DatabaseConfig {
    private const CONFIG_FILE = __DIR__ . '/database.env';
    private const REQUIRED_ENV_VARS = ['DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME'];
    
    public static function getConfig(): array {
        self::validateEnvironment();
        
        return [
            'host' => self::getRequiredEnv('DB_HOST'),
            'user' => self::getRequiredEnv('DB_USER'),
            'pass' => self::getRequiredEnv('DB_PASS'),
            'name' => self::getRequiredEnv('DB_NAME')
        ];
    }
    
    private static function validateEnvironment(): void {
        foreach (self::REQUIRED_ENV_VARS as $var) {
            if (empty(getenv($var))) {
                throw new RuntimeException("Missing required environment variable: {$var}");
            }
        }
    }
    
    private static function getRequiredEnv(string $name): string {
        $value = getenv($name);
        if ($value === false || $value === '') {
            throw new RuntimeException("Required environment variable {$name} is not set");
        }
        return $value;
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
                throw new RuntimeException("Connection failed: " . $conn->connect_error);
            }
            
            $conn->set_charset('utf8mb4');
            return $conn;
        } catch (Exception $e) {
            throw new RuntimeException("Database connection failed: " . $e->getMessage());
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
