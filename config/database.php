<?php
declare(strict_types=1);

class DatabaseConfig {
    private const CONFIG_FILE = __DIR__ . '/database.env';
    private const REQUIRED_ENV_VARS = ['DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME'];
    
    /**
     * Get database configuration with secure environment variable handling
     *
     * @return array<string, string>
     * @throws RuntimeException
     */
    public static function getConfig(): array {
        self::validateEnvironment();
        
        return [
            'host' => self::getRequiredEnv('DB_HOST'),
            'user' => self::getRequiredEnv('DB_USER'),
            'pass' => self::getRequiredEnv('DB_PASS'),
            'name' => self::getRequiredEnv('DB_NAME')
        ];
    }
    
    /**
     * Validate all required environment variables
     *
     * @throws RuntimeException
     */
    private static function validateEnvironment(): void {
        foreach (self::REQUIRED_ENV_VARS as $var) {
            $value = $_ENV[$var] ?? null;
            if (empty($value)) {
                $message = sprintf('Missing required environment variable: %s', 
                    htmlspecialchars($var, ENT_QUOTES, 'UTF-8')
                );
                throw new RuntimeException($message);
            }
        }
    }
    
    /**
     * Get and validate required environment variable
     *
     * @param string $name
     * @return string
     * @throws RuntimeException
     */
    private static function getRequiredEnv(string $name): string {
        $value = $_ENV[$name] ?? null;
        if ($value === null || $value === '') {
            $message = sprintf('Required environment variable %s is not set', 
                htmlspecialchars($name, ENT_QUOTES, 'UTF-8')
            );
            throw new RuntimeException($message);
        }
        return $value;
    }
    
    /**
     * Get database connection with proper error handling
     *
     * @return mysqli
     * @throws RuntimeException
     */
    public static function getConnection(): mysqli {
        $config = self::getConfig();
        
        try {
            mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
            
            $conn = new mysqli(
                $config['host'],
                $config['user'],
                $config['pass'],
                $config['name']
            );
            
            if ($conn->connect_error) {
                throw new RuntimeException('Database connection failed');
            }
            
            $conn->set_charset('utf8mb4');
            return $conn;
            
        } catch (Exception $e) {
            // Log the actual error for debugging but don't expose it
            error_log(sprintf('Database connection error: %s', $e->getMessage()));
            throw new RuntimeException('Database connection failed');
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
