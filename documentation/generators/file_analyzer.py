from pathlib import Path
from typing import Dict, Any, Optional, List
from bs4 import BeautifulSoup
import logging

class FileAnalyzer(BaseGenerator):
    """Handles file analysis and structure generation with improved error handling"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self._setup_logging()
    
    def _setup_logging(self) -> None:
        """Configure logging for the analyzer"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    def analyze_html_file(self, file_path: Path) -> Dict[str, Any]:
        """
        Analyze HTML file and extract key information
        
        Args:
            file_path: Path to the HTML file
            
        Returns:
            Dict containing analyzed file information
            
        Raises:
            FileNotFoundError: If file doesn't exist
            ValueError: If file is not valid HTML
        """
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
            
        try:
            content = file_path.read_text(encoding='utf-8')
            soup = BeautifulSoup(content, 'html.parser')
            
            return {
                'title': self._get_title(soup),
                'meta_description': self._get_meta_description(soup),
                'scripts': self._get_scripts(soup),
                'stylesheets': self._get_stylesheets(soup),
                'sections': self._get_sections(soup),
                'navigation': self._get_navigation(soup),
                'accessibility_score': self._analyze_accessibility(soup)
            }
        except Exception as e:
            self.logger.error(f"Failed to analyze {file_path}: {str(e)}")
            raise ValueError(f"Invalid HTML file: {str(e)}")
    
    def _get_title(self, soup: BeautifulSoup) -> str:
        """Extract and validate page title"""
        title_tag = soup.title
        if not title_tag:
            self.logger.warning("No title tag found")
            return 'No title'
        return title_tag.string.strip()
    
    def _get_meta_description(self, soup: BeautifulSoup) -> str:
        """Extract meta description with fallback"""
        meta = soup.find('meta', {'name': 'description'})
        return meta.get('content', 'No description').strip() if meta else 'No description'
    
    def _get_scripts(self, soup: BeautifulSoup) -> List[Dict[str, str]]:
        """Extract script information with additional metadata"""
        scripts = []
        for script in soup.find_all('script', src=True):
            scripts.append({
                'src': script['src'],
                'async': 'async' in script.attrs,
                'defer': 'defer' in script.attrs,
                'type': script.get('type', 'text/javascript')
            })
        return scripts
    
    def _get_stylesheets(self, soup: BeautifulSoup) -> List[Dict[str, str]]:
        """Extract stylesheet information with media queries"""
        stylesheets = []
        for link in soup.find_all('link', rel='stylesheet'):
            stylesheets.append({
                'href': link['href'],
                'media': link.get('media', 'all'),
                'type': link.get('type', 'text/css')
            })
        return stylesheets
    
    def _get_sections(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Analyze page structure and sections"""
        sections = []
        for section in soup.find_all(['header', 'nav', 'main', 'section', 'footer']):
            sections.append({
                'type': section.name,
                'id': section.get('id', ''),
                'classes': section.get('class', []),
                'headings': len(section.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']))
            })
        return sections
    
    def _get_navigation(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Analyze navigation structure"""
        nav = soup.find('nav')
        if not nav:
            return {'present': False}
            
        return {
            'present': True,
            'items': len(nav.find_all('a')),
            'aria_label': nav.get('aria-label', ''),
            'structure': self._analyze_nav_structure(nav)
        }
    
    def _analyze_nav_structure(self, nav: BeautifulSoup) -> Dict[str, Any]:
        """Analyze navigation menu structure"""
        return {
            'has_list': bool(nav.find('ul')),
            'nested_menus': len(nav.find_all('ul', recursive=True)) > 1,
            'active_item': bool(nav.find(class_='active'))
        }
    
    def _analyze_accessibility(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Perform basic accessibility analysis"""
        return {
            'images_with_alt': len([img for img in soup.find_all('img') if img.get('alt')]),
            'images_without_alt': len([img for img in soup.find_all('img') if not img.get('alt')]),
            'form_labels': len(soup.find_all('label')),
            'aria_landmarks': len([tag for tag in soup.find_all() if any(attr for attr in tag.attrs if attr.startswith('aria-'))]),
            'heading_structure': self._analyze_heading_structure(soup)
        }
    
    def _analyze_heading_structure(self, soup: BeautifulSoup) -> Dict[str, int]:
        """Analyze heading hierarchy"""
        return {
            f'h{i}': len(soup.find_all(f'h{i}'))
            for i in range(1, 7)
        }
