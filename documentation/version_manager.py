from dataclasses import dataclass
from datetime import datetime
from typing import List
import semver
import yaml
from pathlib import Path

@dataclass
class VersionInfo:
    """Version information with validation"""
    version: str
    release_date: datetime
    changes: List[str]
    author: str
    
    def __post_init__(self):
        # Validate semantic versioning
        try:
            semver.VersionInfo.parse(self.version)
        except ValueError as e:
            raise ValueError(f"Invalid version format: {e}")
        
        # Validate release date
        if self.release_date > datetime.now():
            raise ValueError("Release date cannot be in the future")
        
        # Validate changes
        if not self.changes:
            raise ValueError("Changes list cannot be empty")
        
        # Validate author
        if not self.author.strip():
            raise ValueError("Author cannot be empty")

class VersionManager:
    """Manages project versioning with history"""
    
    def __init__(self, version_file: Path):
        self.version_file = Path(version_file)
        self._versions: List[VersionInfo] = []
        self._load_versions()
    
    def _load_versions(self) -> None:
        """Load version history from YAML file"""
        if not self.version_file.exists():
            return
        
        try:
            with self.version_file.open('r') as f:
                data = yaml.safe_load(f)
                if data is None or not isinstance(data, dict):
                    return
                if 'versions' not in data:
                    return
                for version_data in data['versions']:
                    self._versions.append(VersionInfo(
                        version=version_data['version'],
                        release_date=datetime.fromisoformat(version_data['date']),
                        changes=version_data['changes'],
                        author=version_data['author']
                    ))
        except Exception as e:
            raise ValueError(f"Failed to load version history: {e}")
    
    @property
    def current_version(self) -> VersionInfo:
        """Get current version information"""
        if not self._versions:
            raise ValueError("No versions found")
        return max(self._versions, key=lambda v: semver.VersionInfo.parse(v.version))
    
    def add_version(self, version_info: VersionInfo) -> None:
        """Add new version with validation"""
        # Check for duplicate version
        if any(v.version == version_info.version for v in self._versions):
            raise ValueError(f"Version {version_info.version} already exists")
            
        # Validate version increment
        if self._versions:
            current = semver.VersionInfo.parse(self.current_version.version)
            new = semver.VersionInfo.parse(version_info.version)
            if new <= current:
                raise ValueError("New version must be greater than current version")
        
        self._versions.append(version_info)
        self._save_versions()
    
    def get_version(self, version: str) -> VersionInfo:
        """Get specific version information"""
        for v in self._versions:
            if v.version == version:
                return v
        raise ValueError(f"Version {version} not found")

    def _save_versions(self) -> None:
        """Save version history to YAML file"""
        try:
            data = {
                'versions': [
                    {
                        'version': v.version,
                        'date': v.release_date.isoformat(),
                        'changes': v.changes,
                        'author': v.author
                    }
                    for v in sorted(
                        self._versions,
                        key=lambda x: semver.VersionInfo.parse(x.version),
                        reverse=True
                    )
                ]
            }
            
            with self.version_file.open('w') as f:
                yaml.safe_dump(data, f, sort_keys=False)
        except Exception as e:
            raise RuntimeError(f"Failed to save version history: {e}")