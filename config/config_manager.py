from pathlib import Path
from typing import Dict, Any, Optional
import yaml
import os
from dataclasses import dataclass
import logging
from functools import lru_cache

@dataclass(frozen=True)
class ProjectConfig:
    """Project configuration settings with validation"""
    debug: bool
    environment: str
    database: Dict[str, str]
    cache: Dict[str, Any]
    logging: Dict[str, Any]

    def __post_init__(self):
        valid_environments = {'development', 'testing', 'production'}
        if self.environment not in valid_environments:
            raise ValueError(f"Invalid environment. Must be one of: {valid_environments}")
        
        required_db_keys = {'host', 'port', 'name', 'user'}
        if not all(key in self.database for key in required_db_keys):
            raise ValueError(f"Missing required database configuration keys: {required_db_keys}")
        
        if 'level' not in self.logging:
            raise ValueError("Logging configuration must include 'level'")

class ConfigManager:
    """Manages application configuration with environment support and security measures"""
    
    def __init__(self, config_dir: Path):
        self.config_dir = Path(config_dir).resolve()
        if not self.config_dir.exists() or not self.config_dir.is_dir():
            raise ValueError(f"Invalid config directory: {config_dir}")
            
        self.env = os.getenv('APP_ENV', 'development')
        self._config: Optional[ProjectConfig] = None
        self.logger = logging.getLogger(__name__)
    
    @property
    @lru_cache(maxsize=1)
    def config(self) -> ProjectConfig:
        """Lazy load configuration with caching"""
        if self._config is None:
            self._load_config()
        return self._config
    
    def _load_config(self) -> None:
        """Load configuration from multiple sources with security checks"""
        try:
            # Base config
            base_config = self._load_yaml('base.yaml')
            
            # Environment specific config
            env_config = self._load_yaml(f'{self.env}.yaml')
            
            # Local overrides (git-ignored)
            local_config = self._load_yaml('local.yaml')
            
            # Merge configurations
            merged_config = self._merge_configs(base_config, env_config, local_config)
            
            # Apply environment variables
            final_config = self._apply_env_variables(merged_config)
            
            # Validate and create config object
            self._config = ProjectConfig(**final_config)
            
        except Exception as e:
            self.logger.error(f"Failed to load configuration: {str(e)}")
            raise ConfigurationError(f"Configuration loading failed: {str(e)}")
    
    def _load_yaml(self, filename: str) -> Dict[str, Any]:
        """Load YAML configuration file with security checks"""
        try:
            file_path = self.config_dir / filename
            if not file_path.is_file():
                return {}
                
            # Prevent directory traversal
            if not file_path.is_relative_to(self.config_dir):
                raise SecurityError(f"Invalid config file path: {filename}")
            
            with file_path.open('r') as f:
                # Use safe_load instead of load
                return yaml.safe_load(f) or {}
                
        except yaml.YAMLError as e:
            self.logger.error(f"Failed to parse YAML file {filename}: {e}")
            raise ConfigurationError(f"YAML parsing failed: {e}")
        except OSError as e:
            self.logger.error(f"Failed to read config file {filename}: {e}")
            raise ConfigurationError(f"Config file access failed: {e}")
    
    def _validate_config_structure(self, config: Dict[str, Any]) -> None:
        """Validate configuration structure"""
        required_sections = {'database', 'logging', 'cache'}
        missing = required_sections - set(config.keys())
        if missing:
            raise ConfigurationError(f"Missing required configuration sections: {missing}")
    
    def _merge_configs(self, *configs: Dict[str, Any]) -> Dict[str, Any]:
        """Merge configurations securely"""
        result = {}
        for config in configs:
            self._deep_merge(result, config)
        return result
    
    def _deep_merge(self, target: Dict[str, Any], source: Dict[str, Any]) -> None:
        """Perform deep merge of dictionaries with type checking"""
        for key, value in source.items():
            if not isinstance(key, str):
                raise ConfigurationError(f"Invalid configuration key type: {type(key)}")
                
            if isinstance(value, dict):
                target[key] = target.get(key, {})
                if not isinstance(target[key], dict):
                    raise ConfigurationError(f"Type mismatch in configuration for key {key}")
                self._deep_merge(target[key], value)
            else:
                target[key] = value
    
    def _apply_env_variables(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Apply environment variables to configuration"""
        result = config.copy()
        for key, value in os.environ.items():
            if key.startswith('APP_'):
                config_key = key[4:].lower()
                self._set_nested_value(result, config_key.split('_'), value)
        return result
    
    def _set_nested_value(self, config: Dict[str, Any], keys: List[str], value: str) -> None:
        """Set nested dictionary value"""
        current = config
        for key in keys[:-1]:
            current = current.setdefault(key, {})
        current[keys[-1]] = value

class ConfigurationError(Exception):
    """Custom exception for configuration-related errors"""
    pass

class SecurityError(Exception):
    """Custom exception for security-related errors"""
    pass
