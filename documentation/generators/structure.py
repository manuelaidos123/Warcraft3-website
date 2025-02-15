from pathlib import Path
from typing import List, Dict, Set
import logging
from dataclasses import dataclass

@dataclass
class FileMetadata:
    """Metadata for project files"""
    path: Path
    size: int
    extension: str
    is_binary: bool

class ProjectStructureGenerator(BaseGenerator):
    """Generates comprehensive project structure documentation"""
    
    IGNORE_PATTERNS = {
        '.git', '__pycache__', '.vscode', 'node_modules',
        '.DS_Store', 'Thumbs.db', '*.pyc', '*.pyo'
    }
    
    BINARY_EXTENSIONS = {'.jpg', '.png', '.gif', '.ico', '.pdf', '.ttf', '.woff'}
    
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.logger = logging.getLogger(__name__)
        self._setup_logging()
        
    def _setup_logging(self) -> None:
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    def generate_structure(self) -> List[str]:
        """Generate a well-organized project file structure"""
        structure = ["# Project Structure\n"]
        structure.extend(self._generate_overview())
        structure.extend(self._generate_detailed_structure())
        return structure
    
    def _generate_overview(self) -> List[str]:
        """Generate project overview statistics"""
        stats = self._collect_statistics()
        
        return [
            "## Overview\n",
            f"- Total files: {stats['total_files']}",
            f"- Total directories: {stats['total_dirs']}",
            f"- Project size: {self._format_size(stats['total_size'])}\n",
            "### File Types\n",
            *[f"- {ext}: {count} files" for ext, count in stats['extensions'].items()],
            "\n"
        ]
    
    def _collect_statistics(self) -> Dict:
        """Collect project statistics"""
        stats = {
            'total_files': 0,
            'total_dirs': 0,
            'total_size': 0,
            'extensions': {}
        }
        
        for item in self._iterate_project_files():
            if item.is_file():
                stats['total_files'] += 1
                stats['total_size'] += item.stat().st_size
                ext = item.suffix.lower()
                stats['extensions'][ext] = stats['extensions'].get(ext, 0) + 1
            else:
                stats['total_dirs'] += 1
                
        return stats
    
    def _generate_detailed_structure(self) -> List[str]:
        """Generate detailed project structure"""
        structure = ["## Directory Structure\n```"]
        structure.extend(self._format_directory(self.project_root))
        structure.append("```\n")
        return structure
    
    def _format_directory(self, path: Path, prefix: str = "") -> List[str]:
        """Format directory structure with proper indentation"""
        items = sorted(self._iterate_project_files(path))
        tree = []
        
        for index, item in enumerate(items):
            is_last = index == len(items) - 1
            connector = "└── " if is_last else "├── "
            
            if item.is_file():
                metadata = self._get_file_metadata(item)
                tree.append(f"{prefix}{connector}{item.name} ({self._format_size(metadata.size)})")
            else:
                tree.append(f"{prefix}{connector}{item.name}/")
                new_prefix = prefix + ("    " if is_last else "│   ")
                tree.extend(self._format_directory(item, new_prefix))
                
        return tree
    
    def _iterate_project_files(self, path: Path = None) -> Set[Path]:
        """Iterate through project files, excluding ignored patterns"""
        path = path or self.project_root
        
        try:
            items = set()
            for item in path.iterdir():
                if self._should_ignore(item):
                    continue
                items.add(item)
            return items
        except Exception as e:
            self.logger.error(f"Error accessing directory {path}: {str(e)}")
            return set()
    
    def _should_ignore(self, path: Path) -> bool:
        """Check if path should be ignored"""
        return any(
            path.match(pattern) or pattern in str(path)
            for pattern in self.IGNORE_PATTERNS
        )
    
    def _get_file_metadata(self, path: Path) -> FileMetadata:
        """Get file metadata"""
        return FileMetadata(
            path=path,
            size=path.stat().st_size,
            extension=path.suffix.lower(),
            is_binary=path.suffix.lower() in self.BINARY_EXTENSIONS
        )
    
    @staticmethod
    def _format_size(size: int) -> str:
        """Format file size in human-readable format"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f"{size:.1f}{unit}"
            size /= 1024
        return f"{size:.1f}TB"
