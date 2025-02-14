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
        # Main log file with rotation
        main_handler = logging.handlers.RotatingFileHandler(
            self.log_dir / f"{self.app_name}.log",
            maxBytes=10_000_000,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        main_handler.setFormatter(logging.Formatter(self.DEFAULT_FORMAT))
        
        # Error log file
        error_handler = logging.handlers.RotatingFileHandler(
            self.log_dir / f"{self.app_name}_error.log",
            maxBytes=10_000_000,
            backupCount=5,
            encoding='utf-8'
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(logging.Formatter(self.DEFAULT_FORMAT))
        
        # JSON handler for structured logging
        json_handler = logging.handlers.RotatingFileHandler(
            self.log_dir / f"{self.app_name}_structured.json",
            maxBytes=10_000_000,
            backupCount=5,
            encoding='utf-8'
        )
        json_handler.setFormatter(JsonFormatter())
        
        # Configure root logger
        root_logger = logging.getLogger()
        root_logger.setLevel(level)
        
        # Remove existing handlers
        for handler in root_logger.handlers[:]:
            root_logger.removeHandler(handler)
        
        # Add our handlers
        root_logger.addHandler(main_handler)
        root_logger.addHandler(error_handler)
        root_logger.addHandler(json_handler)

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