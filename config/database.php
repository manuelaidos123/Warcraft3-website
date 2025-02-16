<?php
declare(strict_types=1);

use Dotenv\Dotenv;

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
        self::loadEnvironment();
        self::validateEnvironment();
        
        return [
            'host' => self::getRequiredEnv('DB_HOST'),
            'user' => self::getRequiredEnv('DB_USER'),
            'pass' => self::getRequiredEnv('DB_PASS'),
            'name' => self::getRequiredEnv('DB_NAME')
        ];
    }
    
    /**
     * Load environment variables securely
     */
    private static function loadEnvironment(): void {
        if (file_exists(self::CONFIG_FILE)) {
            $dotenv = Dotenv::createImmutable(dirname(self::CONFIG_FILE));
            $dotenv->load();
        }
    }
    
    /**
     * Validate all required environment variables
     *
     * @throws RuntimeException
     */
    private static function validateEnvironment(): void {
        foreach (self::REQUIRED_ENV_VARS as $var) {
            $value = self::getEnvVar($var);
            if (empty($value)) {
                throw new RuntimeException(
                    sprintf('Missing required environment variable: %s', 
                        self::sanitizeOutput($var)
                    )
                );
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
        $value = self::getEnvVar($name);
        if ($value === null || $value === '') {
            throw new RuntimeException(
                sprintf('Required environment variable %s is not set',
                    self::sanitizeOutput($name)
                )
            );
        }
        return $value;
    }
    
    /**
     * Safely get environment variable
     *
     * @param string $name
     * @return string|null
     */
    private static function getEnvVar(string $name): ?string {
        return filter_var(
            getenv($name),
            FILTER_SANITIZE_STRING,
            FILTER_FLAG_STRIP_LOW | FILTER_FLAG_STRIP_HIGH
        );
    }
    
    /**
     * Sanitize output to prevent XSS
     *
     * @param string $value
     * @return string
     */
    private static function sanitizeOutput(string $value): string {
        return htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }
    
    /**
     * Get database connection with proper error handling
     *
     * @return PDO
     * @throws RuntimeException
     */
    public static function getConnection(): PDO {
        $config = self::getConfig();
        
        try {
            $dsn = sprintf(
                "mysql:host=%s;dbname=%s;charset=utf8mb4",
                $config['host'],
                $config['name']
            );
            
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];
            
            return new PDO($dsn, $config['user'], $config['pass'], $options);
            
        } catch (PDOException $e) {
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
