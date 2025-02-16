from pathlib import Path
from dataclasses import dataclass

@dataclass
class FileMetadata:
    """Metadata for project files with comprehensive validation"""
    path: Path
    size: int
    extension: str
    is_binary: bool
    
    def __post_init__(self):
        if self.size < 0:
            raise ValueError("File size cannot be negative")
        if self.size > 100 * 1024 * 1024:  # 100MB limit
            raise ValueError("File exceeds maximum allowed size")
        if not self.extension.startswith('.'):
            raise ValueError("Extension must start with '.'")
        if not isinstance(self.path, Path):
            raise TypeError("path must be a Path object")
        if not isinstance(self.is_binary, bool):
            raise TypeError("is_binary must be a boolean")

    @property
    def is_valid(self) -> bool:
        """Check if file metadata represents a valid file"""
        return (
            self.path.exists() and 
            self.path.is_file() and
            self.size > 0 and 
            len(self.extension) > 1
        )

    @property
    def relative_path(self) -> str:
        """Get the relative path as a string"""
        try:
            return str(self.path.relative_to(Path.cwd()))
        except ValueError:
            return str(self.path)

    @property
    def formatted_size(self) -> str:
        """Get human-readable file size"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if self.size < 1024:
                return f"{self.size:.1f}{unit}"
            self.size /= 1024
        return f"{self.size:.1f}TB"
