from pathlib import Path
from typing import Dict, Any, List, Set
from bs4 import BeautifulSoup
import logging
from urllib.parse import urlparse
import re
from functools import lru_cache
from ..generators.models import FileMetadata

class FileAnalyzer:
    """Handles file analysis and structure generation with improved security"""
    
    ALLOWED_EXTENSIONS = {'.html', '.css', '.js', '.py', '.md', '.txt'}
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    BINARY_EXTENSIONS = {'.jpg', '.png', '.gif', '.ico', '.pdf', '.ttf', '.woff'}
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self._setup_logging()
        self._analyzed_files: Set[Path] = set()
    
    def _get_file_metadata(self, file_path: Path) -> FileMetadata:
        """Create FileMetadata instance for the given file"""
        return FileMetadata(
            path=file_path,
            size=file_path.stat().st_size,
            extension=file_path.suffix.lower(),
            is_binary=file_path.suffix.lower() in self.BINARY_EXTENSIONS
        )
    
    def _setup_logging(self) -> None:
        """Configure logging with proper format"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.StreamHandler(),
                logging.FileHandler('file_analysis.log')
            ]
        )
    
    @lru_cache(maxsize=100)
    def analyze_html_file(self, file_path: Path) -> Dict[str, Any]:
        """
        Analyze HTML file with security measures
        
        Args:
            file_path: Path to the HTML file
            
        Returns:
            Dict containing analyzed file information
            
        Raises:
            SecurityError: If file violates security constraints
            ValueError: If file is invalid
        """
        try:
            safe_path = self._validate_file_path(file_path)
            self._check_file_size(safe_path)
            
            # Create and validate file metadata
            metadata = self._get_file_metadata(safe_path)
            if not metadata.is_valid:
                raise ValueError(f"Invalid file: {safe_path}")
            
            content = self._read_file_safely(safe_path)
            soup = BeautifulSoup(content, 'html.parser', parser='html5lib')
            
            return {
                'metadata': metadata,
                'title': self._get_safe_title(soup),
                'meta_description': self._get_safe_meta_description(soup),
                'scripts': self._get_safe_scripts(soup),
                'stylesheets': self._get_safe_stylesheets(soup),
                'sections': self._get_safe_sections(soup),
                'navigation': self._get_safe_navigation(soup),
                'accessibility_score': self._analyze_accessibility(soup)
            }
        except Exception as e:
            self.logger.error(f"Failed to analyze {file_path}: {str(e)}")
            raise
    
    def _validate_file_path(self, file_path: Path) -> Path:
        """Validate file path for security"""
        safe_path = Path(file_path).resolve()
        if not safe_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        if safe_path.suffix.lower() not in self.ALLOWED_EXTENSIONS:
            raise SecurityError(f"Unsupported file type: {safe_path.suffix}")
        
        return safe_path
    
    def _check_file_size(self, file_path: Path) -> None:
        """Check file size against limits"""
        if file_path.stat().st_size > self.MAX_FILE_SIZE:
            raise SecurityError(f"File exceeds size limit: {file_path}")
    
    def _read_file_safely(self, file_path: Path) -> str:
        """Read file content with security checks"""
        try:
            with file_path.open('r', encoding='utf-8') as f:
                content = f.read(self.MAX_FILE_SIZE + 1)
                if len(content) > self.MAX_FILE_SIZE:
                    raise SecurityError("File content exceeds size limit")
                return content
        except UnicodeDecodeError:
            raise ValueError(f"File is not valid UTF-8: {file_path}")
    
    def _get_safe_title(self, soup: BeautifulSoup) -> str:
        """Get sanitized page title"""
        title = soup.title.string if soup.title else 'No title'
        return self._sanitize_text(title)
    
    @staticmethod
    def _sanitize_text(text: str) -> str:
        """Sanitize text content"""
        return re.sub(r'[<>&"\']', '', str(text))
    
    def _get_safe_scripts(self, soup: BeautifulSoup) -> List[str]:
        """Get sanitized script sources"""
        scripts = []
        for script in soup.find_all('script', src=True):
            src = script.get('src', '')
            if self._is_safe_url(src):
                scripts.append(src)
        return scripts
    
    @staticmethod
    def _is_safe_url(url: str) -> bool:
        """Validate URL for security"""
        try:
            parsed = urlparse(url)
            return bool(parsed.netloc) and parsed.scheme in {'http', 'https'}
        except Exception:
            return False

class SecurityError(Exception):
    """Custom exception for security-related errors"""
    pass
