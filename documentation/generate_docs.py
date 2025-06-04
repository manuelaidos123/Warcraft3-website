# Standard library imports
import os
import datetime
import logging
from typing import Dict, List, Optional, Tuple
from pathlib import Path
from dataclasses import dataclass
import re  # For safe file name validation

# Third-party imports
from bs4 import BeautifulSoup
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import (
    getSampleStyleSheet,
    ParagraphStyle
)
from reportlab.lib.units import inch
from reportlab.lib.enums import (
    TA_LEFT,
    TA_CENTER,
    TA_RIGHT
)
from reportlab.platypus import (
    SimpleDocTemplate, 
    Paragraph,         
    Spacer,           
    PageTemplate,     
    Frame,            
    PageBreak,        
    Image            
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Type aliases
StyleConfig = Tuple[str, ParagraphStyle, Dict[str, any]]

@dataclass
class DocumentConfig:
    """Configuration for document generation"""
    version: str
    release_date: str
    project_name: str
    output_path: Path
    
    @classmethod
    def default(cls, project_root: Path) -> 'DocumentConfig':
        """Create default configuration"""
        return cls(
            version="1.0.0",
            release_date="2024-01-15",
            project_name="Warcraft III Website",
            output_path=project_root / "documentation"
        )

class BaseGenerator:
    """Base class for document generation components"""
    
    def __init__(self, config: DocumentConfig):
        self.config = config
        self.logger = logging.getLogger(self.__class__.__name__)

class StyleGenerator(BaseGenerator):
    """Handles document styling"""
    
    def __init__(self, config: DocumentConfig):
        super().__init__(config)
        self.styles = getSampleStyleSheet()
        self._create_custom_styles()
    
    def _create_custom_styles(self) -> None:
        """Create custom styles for the document"""
        style_configs: List[StyleConfig] = [
            ('CoverTitle', self.styles['Heading1'], {
                'fontSize': 32,
                'spaceAfter': 30,
                'alignment': TA_CENTER,
                'textColor': colors.HexColor('#2F89FC')
            }),
            ('LeftAlignedHeading', self.styles['Heading1'], {
                'fontSize': 24,
                'spaceAfter': 20,
                'alignment': TA_LEFT,  # Using TA_LEFT
                'textColor': colors.HexColor('#2F89FC')
            }),
            ('RightAlignedHeading', self.styles['Heading2'], {
                'fontSize': 18,
                'spaceAfter': 15,
                'alignment': TA_RIGHT,  # Using TA_RIGHT
                'textColor': colors.HexColor('#2F89FC')
            })
        ]
        
        for name, parent, properties in style_configs:
            self.styles.add(ParagraphStyle(name=name, parent=parent, **properties))

class DocumentationGenerator:
    """Generates comprehensive documentation for the Warcraft3 website project."""
    
    def __init__(self, project_root: str, config: Optional[DocumentConfig] = None):
        """Initialize the documentation generator."""
        # Sanitize project root path
        self.project_root = Path(project_root).resolve()
        if not self.project_root.exists() or not self.project_root.is_dir():
            raise ValueError(f"Invalid project root: {project_root}")
            
        # Validate config
        self.config = config or DocumentConfig.default(self.project_root)
        
        # Configure logging
        self.logger = logging.getLogger(__name__)
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
            self.logger.addHandler(handler)
            self.logger.setLevel(logging.INFO)

        # Initialize styles
        self.styles = getSampleStyleSheet()
        self._create_custom_styles()

    def setup_output_directory(self) -> None:
        """Create output directory if it doesn't exist."""
        self.config.output_path.mkdir(parents=True, exist_ok=True)

    def setup_styles(self) -> None:
        """Initialize document styles."""
        try:
            self._create_custom_styles()
        except Exception as e:
            self.logger.error(f"Failed to create custom styles: {e}")
            raise

    def _create_custom_styles(self) -> None:
        """Create all custom styles for the document"""
        style_configs = [
            ('CoverTitle', self.styles['Heading1'], {
                'fontSize': 32,
                'spaceAfter': 30,
                'alignment': TA_CENTER,
                'textColor': colors.HexColor('#2F89FC')
            }),
            ('CoverInfo', self.styles['Normal'], {
                'fontSize': 12,
                'spaceAfter': 20,
                'alignment': TA_CENTER
            }),
            ('FileContent', self.styles['Normal'], {
                'fontSize': 10,
                'leftIndent': 20
            }),
            ('CodeBlock', self.styles['Normal'], {
                'fontSize': 9,
                'fontName': 'Courier',
                'leftIndent': 20,
                'rightIndent': 20,
                'spaceAfter': 15,
                'spaceBefore': 15,
                'backColor': colors.lightgrey
            }),
            ('CustomHeading1', self.styles['Heading1'], {
                'fontSize': 24,
                'spaceAfter': 20,
                'textColor': colors.HexColor('#2F89FC')
            }),
            ('CustomHeading2', self.styles['Heading2'], {
                'fontSize': 18,
                'spaceAfter': 15,
                'textColor': colors.HexColor('#2F89FC')
            }),
            ('CustomHeading3', self.styles['Heading3'], {
                'fontSize': 14,
                'spaceAfter': 10,
                'textColor': colors.HexColor('#2F89FC')
            })
        ]
        
        for name, parent, properties in style_configs:
            try:
                self.styles.add(ParagraphStyle(name=name, parent=parent, **properties))
            except KeyError:
                # If style already exists, update it instead
                self.styles[name].fontSize = properties.get('fontSize', self.styles[name].fontSize)
                self.styles[name].spaceAfter = properties.get('spaceAfter', self.styles[name].spaceAfter)
                self.styles[name].alignment = properties.get('alignment', self.styles[name].alignment)
                self.styles[name].textColor = properties.get('textColor', self.styles[name].textColor)
                self.styles[name].leftIndent = properties.get('leftIndent', self.styles[name].leftIndent)
                self.styles[name].rightIndent = properties.get('rightIndent', self.styles[name].rightIndent)
                self.styles[name].spaceBefore = properties.get('spaceBefore', self.styles[name].spaceBefore)
                self.styles[name].backColor = properties.get('backColor', self.styles[name].backColor)
                self.styles[name].fontName = properties.get('fontName', self.styles[name].fontName)

    def analyze_html_file(self, file_path: str) -> dict:
        """
        Analyze HTML file and extract key information.
        
        Args:
            file_path: Path to the HTML file
            
        Returns:
            Dictionary containing extracted information
            
        Raises:
            SecurityError: If path is outside project root
            ValueError: If file is invalid
        """
        # Validate and sanitize file path
        try:
            safe_path = Path(file_path).resolve()
            if not safe_path.is_relative_to(self.project_root):
                raise SecurityError("Access denied: Path outside project root")
            
            if not safe_path.exists() or not safe_path.is_file():
                raise ValueError(f"Invalid file path: {file_path}")
                
            # Validate file extension
            if safe_path.suffix.lower() != '.html':
                raise ValueError("File must be an HTML file")
                
            with safe_path.open('r', encoding='utf-8') as file:
                content = file.read()
                return self._parse_html_content(content)
                
        except Exception as e:
            self.logger.error(f"Error analyzing file {file_path}: {str(e)}")
            raise

    @staticmethod
    def _parse_html_content(content: str) -> dict:
        """Parse HTML content safely"""
        try:
            soup = BeautifulSoup(content, 'html.parser')
            return {
                'title': soup.title.string if soup.title else 'No title',
                'meta_description': soup.find('meta', {'name': 'description'})['content'] 
                    if soup.find('meta', {'name': 'description'}) else 'No description',
                'scripts': [script.get('src', '') for script in soup.find_all('script', src=True)],
                'stylesheets': [link.get('href', '') for link in soup.find_all('link', rel='stylesheet')],
                'sections': [section.name for section in soup.find_all(['header', 'nav', 'main', 'section', 'footer'])]
            }
        except Exception as e:
            raise ValueError(f"Failed to parse HTML content: {str(e)}")

    def generate_file_structure(self):
        """Generate a well-organized project file structure"""
        structure = ["Project Structure\n==================\n"]
        
        def format_directory(path, prefix=""):
            items = os.listdir(path)
            dirs = sorted([d for d in items if os.path.isdir(os.path.join(path, d)) and not d.startswith('.')])
            files = sorted([f for f in items if os.path.isfile(os.path.join(path, f)) and not f.startswith('.')])
            
            tree = []
            
            # Add directories
            for d in dirs:
                if d not in ['.git', '__pycache__']:  # Exclude specific directories
                    tree.append(f"{prefix}📁 {d}/")
                    subtree = format_directory(os.path.join(path, d), prefix + "    ")
                    tree.extend(subtree)
            
            # Add files
            for f in files:
                if f != 'generate_docs.py':  # Exclude the documentation generator itself
                    tree.append(f"{prefix}📄 {f}")
            
            return tree

        # Main project structure
        structure.extend([
            "Root Directory\n",
            "Main Application Files",
            "-------------------"
        ])
        
        # HTML Files
        structure.append("\n📁 HTML Pages:")
        html_files = [f for f in os.listdir(self.project_root) if f.endswith('.html')]
        for html in sorted(html_files):
            structure.append(f"    📄 {html}")

        # Assets Structure
        structure.append("\n📁 Assets:")
        
        # Images
        if os.path.exists(os.path.join(self.project_root, 'images')):
            structure.append("    📁 images/")
            image_dirs = os.listdir(os.path.join(self.project_root, 'images'))
            for dir in sorted(image_dirs):
                if os.path.isdir(os.path.join(self.project_root, 'images', dir)):
                    structure.append(f"        📁 {dir}/")
                    images = os.listdir(os.path.join(self.project_root, 'images', dir))
                    for img in sorted(images):
                        if os.path.isfile(os.path.join(self.project_root, 'images', dir, img)):
                            structure.append(f"            📄 {img}")
                elif os.path.isfile(os.path.join(self.project_root, 'images', dir)):
                    structure.append(f"        �� {dir}")

        # Styles
        structure.append("\n📁 Styles:")
        css_files = [f for f in os.listdir(self.project_root) if f.endswith('.css')]
        for css in sorted(css_files):
            structure.append(f"    ��� {css}")

        # Scripts
        structure.append("\n📁 JavaScript:")
        if os.path.exists(os.path.join(self.project_root, 'js')):
            js_files = os.listdir(os.path.join(self.project_root, 'js'))
            for js in sorted(js_files):
                structure.append(f"    ��� {js}")

        # Sounds
        if os.path.exists(os.path.join(self.project_root, 'sounds')):
            structure.append("\n📁 Sound Assets:")
            sound_files = os.listdir(os.path.join(self.project_root, 'sounds'))
            for sound in sorted(sound_files):
                structure.append(f"    ��� {sound}")

        # Documentation
        structure.append("\n📁 Documentation:")
        if os.path.exists(os.path.join(self.project_root, 'documentation')):
            doc_files = [f for f in os.listdir(os.path.join(self.project_root, 'documentation')) 
                        if f != 'generate_docs.py']
            for doc in sorted(doc_files):
                structure.append(f"    ��� {doc}")

        return structure

    def header_footer(self, canvas, doc):
        """Add header and footer to each page"""
        canvas.saveState()
        
        # Header
        canvas.setFont('Helvetica', 9)
        canvas.drawString(72, 800, "Warcraft III Website - Technical Documentation")
        canvas.drawRightString(540, 800, f"Version {self.config.version}")
        canvas.line(72, 797, 540, 797)
        
        # Footer
        canvas.drawString(72, 30, f"Generated: {datetime.datetime.now().strftime('%Y-%m-%d')}")
        canvas.drawRightString(540, 30, f"Page {doc.page}")
        canvas.line(72, 45, 540, 45)
        
        canvas.restoreState()

    def create_cover_page(self):
        """Create the cover page elements"""
        elements = []
        
        # Logo
        elements.append(Image(
            os.path.join(self.project_root, 'images', 'icons', 'footer-logo.png'),
            width=200,
            height=100
        ))
        elements.append(Spacer(1, inch))
        
        # Title
        elements.append(Paragraph(
            "Technical Documentation",
            self.styles['CoverTitle']
        ))
        elements.append(Paragraph(
            "Warcraft III Website Project",
            self.styles['CoverTitle']
        ))
        elements.append(Spacer(1, inch))
        
        # Version information
        version_info = f"""
        Version: {self.config.version}
        Initial Release Date: {self.config.release_date}
        Document Generated: {datetime.datetime.now().strftime('%Y-%m-%d')}
        """
        elements.append(Paragraph(version_info, self.styles['CoverInfo']))
        elements.append(Spacer(1, inch))
        
        # Contributors
        contributors = """
        Contributors:
        - Andrei Kornev (Lead Developer)
        - [Other team members...]
        """
        elements.append(Paragraph(contributors, self.styles['CoverInfo']))
        
        # Change Log
        changelog = """
        Change Log:
        
        Version 1.0.0 (2024-01-15)
        - Initial release
        - Implemented core website structure
        - Added responsive design
        - Integrated voice recognition feature
        - Completed WarcraftPedia section
        
        Version 0.9.0 (2023-12-20)
        - Beta release
        - Added character profiles
        - Implemented story navigation
        - Enhanced UI/UX design
        
        Version 0.5.0 (2023-11-15)
        - Alpha release
        - Basic website structure
        - Initial content implementation
        """
        elements.append(Paragraph(changelog, self.styles['Normal']))
        
        return elements

    def create_pdf(self):
        """Generate the PDF documentation"""
        try:
            # Ensure proper PDF filename with extension
            filename = 'technical_documentation.pdf'
            if not filename.endswith('.pdf'):
                filename += '.pdf'
            
            # Create full path
            doc_path = self.config.output_path / filename
            
            # Validate output directory
            if not self.config.output_path.exists():
                self.config.output_path.mkdir(parents=True, exist_ok=True)
            
            # Remove existing file if it exists
            if doc_path.exists():
                doc_path.unlink()
            
            # Create document with templates
            doc = SimpleDocTemplate(
                str(doc_path),
                pagesize=A4,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=72
            )
            
            # Create page templates
            frame = Frame(
                doc.leftMargin,
                doc.bottomMargin,
                doc.width,
                doc.height,
                id='normal'
            )
            
            template = PageTemplate(
                id='standard',
                frames=frame,
                onPage=self.header_footer
            )
            
            doc.addPageTemplates([template])
            
            # Start building the document
            story = []
            
            # Add cover page
            story.extend(self.create_cover_page())
            story.append(PageBreak())
            
            # Add table of contents
            story.append(Paragraph('Table of Contents', self.styles['CustomHeading1']))
            toc = [
                '1. Project Overview',
                '2. System Architecture',
                '3. User Interface Design',
                '4. Technical Implementation',
                '5. Security Considerations',
                '6. Testing and Quality Assurance',
                '7. Deployment Guide',
                '8. Maintenance Procedures'
            ]
            for item in toc:
                story.append(Paragraph(item, self.styles['Normal']))
            story.append(Spacer(1, 0.5*inch))

            # Add main content sections with proper formatting
            sections = {
                '1. Project Overview': self.create_project_overview(),
                '2. System Architecture': self.create_system_architecture(),
                '3. User Interface Design': self.create_ui_design(),
                '4. Technical Implementation': self.create_technical_implementation(),
                '5. Security Considerations': self.create_security_section(),
                '6. Testing and Quality Assurance': self.create_testing_section(),
                '7. Deployment Guide': self.create_deployment_guide(),
                '8. Maintenance Procedures': self.create_maintenance_procedures()
            }
            
            for title, content in sections.items():
                story.append(Paragraph(title, self.styles['CustomHeading1']))
                story.extend(content)
                story.append(PageBreak())
            
            # Build the PDF
            doc.build(story)
            self.logger.info(f"Documentation generated successfully at: {doc_path}")
            
        except Exception as e:
            self.logger.error(f"Error creating PDF: {str(e)}")
            raise

    def create_project_overview(self):
        """Create project overview section"""
        elements = []
        
        # Project Description
        elements.append(Paragraph("Project Description", self.styles['CustomHeading2']))
        overview_text = """
        The Warcraft III Website is a comprehensive fan-made platform dedicated to the iconic game 
        Warcraft III. This project serves as an interactive resource for both new players and veterans, 
        offering detailed information about the game's story, characters, factions, and gameplay mechanics.
        """
        elements.append(Paragraph(overview_text, self.styles['Normal']))
        elements.append(Spacer(1, 0.2*inch))

        # Key Features
        elements.append(Paragraph("Key Features", self.styles['CustomHeading2']))
        features = [
            "Responsive design supporting multiple device types and screen sizes",
            "Interactive story navigation system",
            "Comprehensive WarcraftPedia with detailed game information",
            "Character profiles and faction descriptions",
            "Modern UI/UX with Bootstrap 5 integration",
            "Custom CSS styling for enhanced visual appeal",
            "Voice recognition features for accessibility"
        ]
        for feature in features:
            elements.append(Paragraph(f"• {feature}", self.styles['Normal']))
        elements.append(Spacer(1, 0.2*inch))

        return elements

    def create_system_architecture(self):
        """Create system architecture section"""
        elements = []
        
        # Frontend Architecture
        elements.append(Paragraph("Frontend Architecture", self.styles['CustomHeading2']))
        frontend_text = """
        The website utilizes a modern frontend stack:
        • HTML5 for structure and semantics
        • CSS3 with custom styling and Bootstrap 5 framework
        • JavaScript for interactive features and dynamic content
        • Responsive design principles for multi-device support
        """
        elements.append(Paragraph(frontend_text, self.styles['Normal']))
        elements.append(Spacer(1, 0.2*inch))

        # File Structure
        elements.append(Paragraph("Project Structure", self.styles['CustomHeading2']))
        structure = self.generate_file_structure()
        for line in structure:
            elements.append(Paragraph(line, self.styles['FileContent']))
        
        return elements

    def create_ui_design(self):
        """Create user interface design section with visual examples"""
        elements = []
        
        # Design Philosophy
        elements.append(Paragraph("Design Philosophy", self.styles['CustomHeading2']))
        design_text = """
        The user interface follows a game-themed design language while maintaining modern web standards:
        • Dark theme with accent colors matching Warcraft III's aesthetic
        • Responsive grid layout using Bootstrap's container system
        • Interactive elements with hover effects and animations
        • Consistent typography using Google Fonts
        """
        elements.append(Paragraph(design_text, self.styles['Normal']))
        elements.append(Spacer(1, 0.2*inch))

        # Add Color Palette
        elements.append(Paragraph("Color Palette", self.styles['CustomHeading3']))
        color_vars = """
        :root {
            --wc-primary: #2f89fc;
            --wc-dark: #121212;
            --wc-light: #ffffff;
            --wc-gray: #f8f9fa;
            --wc-border: rgba(255, 255, 255, 0.1);
        }
        """
        elements.append(Paragraph(color_vars, self.styles['CodeBlock']))
        
        # Add UI Components Screenshot
        ui_components_path = os.path.join(self.project_root, 'documentation', 'screenshots', 'ui_components.png')
        if os.path.exists(ui_components_path):
            elements.append(Paragraph("UI Components Overview:", self.styles['CustomHeading3']))
            elements.append(Image(ui_components_path, width=400, height=300))
        
        return elements

    def create_technical_implementation(self):
        """Create technical implementation section with code examples and screenshots"""
        elements = []
        
        # Technologies Used
        elements.append(Paragraph("Technologies Used", self.styles['CustomHeading2']))
        tech_stack = """
        The website is built using the following technologies:
        • HTML5 for structure
        • CSS3 and Bootstrap 5 for styling
        • JavaScript for interactivity
        • Font Awesome for icons
        • Google Fonts for typography
        • Custom CSS variables for theming
        """
        elements.append(Paragraph(tech_stack, self.styles['Normal']))
        elements.append(Spacer(1, 0.2*inch))

        # Add Navigation Code Example
        elements.append(Paragraph("Navigation Implementation", self.styles['CustomHeading3']))
        # Use escaped HTML or preformatted text
        nav_code = """
        &lt;!-- Navigation implementation --&gt;
        &lt;nav class="navbar navbar-expand-lg navbar-dark fixed-top" id="mainNav"&gt;
            &lt;div class="container"&gt;
                &lt;a class="navbar-brand" href="index.html"&gt;
                    &lt;img src="images/logo.png" alt="Warcraft III Logo" height="40"&gt;
                    Warcraft III
                &lt;/a&gt;
                &lt;!-- Navigation items --&gt;
            &lt;/div&gt;
        &lt;/nav&gt;
        """
        elements.append(Paragraph(nav_code, self.styles['CodeBlock']))
        
        # Add screenshot of the navigation
        nav_image_path = os.path.join(self.project_root, 'documentation', 'screenshots', 'navigation.png')
        if os.path.exists(nav_image_path):
            elements.append(Image(nav_image_path, width=400, height=100))
        elements.append(Spacer(1, 0.2*inch))

        # Add Responsive Design Example
        elements.append(Paragraph("Responsive Design Implementation", self.styles['CustomHeading3']))
        responsive_code = """
        /* Responsive design CSS */
        @media (max-width: 768px) {
            .hero-section {
                padding: 2rem 1rem;
            }
            .card-grid {
                grid-template-columns: 1fr;
            }
        }
        """
        elements.append(Paragraph(responsive_code, self.styles['CodeBlock']))
        
        # Add responsive design screenshots
        responsive_desktop = os.path.join(self.project_root, 'documentation', 'screenshots', 'desktop_view.png')
        responsive_mobile = os.path.join(self.project_root, 'documentation', 'screenshots', 'mobile_view.png')
        if os.path.exists(responsive_desktop) and os.path.exists(responsive_mobile):
            elements.append(Paragraph("Desktop vs Mobile View:", self.styles['CustomHeading4']))
            elements.append(Image(responsive_desktop, width=300, height=200))
            elements.append(Image(responsive_mobile, width=150, height=200))
        
        return elements

    def create_security_section(self):
        """Create security considerations section"""
        elements = []
        
        # Security Measures
        elements.append(Paragraph("Security Measures", self.styles['CustomHeading2']))
        security_text = """
        The website implements several security best practices:
        • Content Security Policy (CSP) headers
        • HTTPS-only content delivery
        • Sanitized user inputs
        • Protected API endpoints
        • Regular security updates for dependencies
        """
        elements.append(Paragraph(security_text, self.styles['Normal']))
        
        return elements

    def create_testing_section(self):
        """Create testing and quality assurance section"""
        elements = []
        
        # Testing Strategy
        elements.append(Paragraph("Testing Strategy", self.styles['CustomHeading2']))
        testing_text = """
        Quality assurance is maintained through:
        • Cross-browser testing (Chrome, Firefox, Safari, Edge)
        • Mobile responsiveness testing
        • Performance optimization
        • Accessibility compliance checks
        • User experience testing
        """
        elements.append(Paragraph(testing_text, self.styles['Normal']))
        
        return elements

    def create_deployment_guide(self):
        """Create deployment guide section"""
        elements = []
        
        # Deployment Process
        elements.append(Paragraph("Deployment Process", self.styles['CustomHeading2']))
        deployment_text = """
        The website deployment process includes:
        • Version control with Git
        • Automated builds and testing
        • Asset optimization (image compression, CSS/JS minification)
        • CDN integration for static assets
        • Regular backups and monitoring
        """
        elements.append(Paragraph(deployment_text, self.styles['Normal']))
        
        return elements

    def create_maintenance_procedures(self):
        """Create maintenance procedures section"""
        elements = []
        
        # Maintenance Guidelines
        elements.append(Paragraph("Maintenance Guidelines", self.styles['CustomHeading2']))
        maintenance_text = """
        Regular maintenance procedures include:
        • Weekly content updates
        • Monthly security patches
        • Performance monitoring and optimization
        • User feedback collection and implementation
        • Regular backups and system health checks
        """
        elements.append(Paragraph(maintenance_text, self.styles['Normal']))
        
        return elements

    def setup_screenshots_folder(self):
        """Create screenshots folder and ensure it exists"""
        screenshots_dir = os.path.join(self.project_root, 'documentation', 'screenshots')
        os.makedirs(screenshots_dir, exist_ok=True)
        return screenshots_dir

class SecurityError(Exception):
    """Custom exception for security-related errors"""
    pass

if __name__ == '__main__':
    # Get the project root directory (assuming this script is in the documentation folder)
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Create documentation folder if it doesn't exist
    doc_folder = os.path.join(project_root, 'documentation')
    os.makedirs(doc_folder, exist_ok=True)
    
    # Generate documentation
    generator = DocumentationGenerator(project_root)
    generator.create_pdf()
