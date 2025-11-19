import logging
import logging.handlers
from pathlib import Path
import json
from datetime import datetime

class LogConfig:
    """Centralized logging configuration"""
    
    DEFAULT_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    def __init__(self, log_dir: Path, app_name: str):
        self.log_dir = Path(log_dir)
        self.app_name = app_name
        self.log_dir.mkdir(parents=True, exist_ok=True)
    
    def configure(self, level: int = logging.INFO) -> None:
        """Configure logging with rotation and proper formatting"""
        try:
            # Main log file with rotation
            main_handler = self._create_rotating_handler(
                f"{self.app_name}.log",
                self.DEFAULT_FORMAT
            )
            
            # Error log file
            error_handler = self._create_rotating_handler(
                f"{self.app_name}_error.log",
                self.DEFAULT_FORMAT,
                logging.ERROR
            )
            
            # JSON handler
            json_handler = self._create_rotating_handler(
                f"{self.app_name}_structured.json",
                None,
                formatter=JsonFormatter()
            )
            
            # Configure root logger
            root_logger = logging.getLogger()
            root_logger.setLevel(level)
            
            # Remove existing handlers
            for handler in root_logger.handlers[:]:
                root_logger.removeHandler(handler)
            
            # Add handlers
            root_logger.addHandler(main_handler)
            root_logger.addHandler(error_handler)
            root_logger.addHandler(json_handler)
            
        except Exception as e:
            raise RuntimeError(f"Failed to configure logging: {e}")

    def _create_rotating_handler(self, filename: str, format_str: str = None, 
                               level: int = None, formatter: logging.Formatter = None) -> logging.Handler:
        """Create a rotating file handler with error handling"""
        try:
            handler = logging.handlers.RotatingFileHandler(
                self.log_dir / filename,
                maxBytes=10_000_000,
                backupCount=5,
                encoding='utf-8'
            )
            
            if level is not None:
                handler.setLevel(level)
                
            if format_str:
                handler.setFormatter(logging.Formatter(format_str))
            elif formatter:
                handler.setFormatter(formatter)
                
            return handler
            
        except Exception as e:
            raise RuntimeError(f"Failed to create handler for {filename}: {e}")

class JsonFormatter(logging.Formatter):
    """JSON formatter for structured logging"""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON"""
        data = {
            'timestamp': datetime.fromtimestamp(record.created).isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        
        if record.exc_info:
            data['exception'] = self.formatException(record.exc_info)
            
        return json.dumps(data)