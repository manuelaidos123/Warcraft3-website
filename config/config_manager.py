from pathlib import Path
from typing import Dict, Any, Optional
import yaml
import os
from dataclasses import dataclass

@dataclass
class ProjectConfig:
    """Project configuration settings"""
    debug: bool
    environment: str
    database: Dict[str, str]
    cache: Dict[str, Any]
    logging: Dict[str, Any]

class ConfigManager:
    """Manages application configuration with environment support"""
    
    def __init__(self, config_dir: Path):
        self.config_dir = config_dir
        self.env = os.getenv('APP_ENV', 'development')
        self._config: Optional[ProjectConfig] = None
    
    @property
    def config(self) -> ProjectConfig:
        """Lazy load configuration"""
        if self._config is None:
            self._load_config()
        return self._config
    
    def _load_config(self) -> None:
        """Load configuration from multiple sources"""
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
        
        self._config = ProjectConfig(**final_config)
    
    def _load_yaml(self, filename: str) -> Dict[str, Any]:
        """Load YAML configuration file"""
        config_path = self.config_dir / filename
        if not config_path.exists():
            return {}
            
        try:
            with config_path.open('r', encoding='utf-8') as f:
                return yaml.safe_load(f) or {}
        except Exception as e:
            print(f"Error loading config {filename}: {e}")
            return {}
    
    def _merge_configs(self, *configs: Dict) -> Dict[str, Any]:
        """Deep merge multiple configurations"""
        result = {}
        for config in configs:
            self._deep_merge(result, config)
        return result
    
    def _deep_merge(self, target: Dict, source: Dict) -> None:
        """Recursively merge dictionaries"""
        for key, value in source.items():
            if key in target and isinstance(target[key], dict) and isinstance(value, dict):
                self._deep_merge(target[key], value)
            else:
                target[key] = value
    
    def _apply_env_variables(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Apply environment variables to configuration"""
        result = config.copy()
        
        for key, value in os.environ.items():
            if key.startswith('APP_'):
                config_key = key[4:].lower()
                path = config_key.split('_')
                current = result
                
                for part in path[:-1]:
                    if part not in current:
                        current[part] = {}
                    current = current[part]
                
                current[path[-1]] = value
                
        return result
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value by key"""
        try:
            current = self.config
            for part in key.split('.'):
                current = getattr(current, part)
            return current
        except AttributeError:
            return default
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary"""
        return {
            'debug': self.config.debug,
            'environment': self.config.environment,
            'database': self.config.database,
            'cache': self.config.cache,
            'logging': self.config.logging
        }
    
    def save_config(self) -> None:
        """Save current configuration to file"""
        config_path = self.config_dir / f'{self.env}.yaml'
        with config_path.open('w', encoding='utf-8') as f:
            yaml.dump(self.to_dict(), f, default_flow_style=False)