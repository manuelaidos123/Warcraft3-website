import os
import datetime
from bs4 import BeautifulSoup
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageTemplate, Frame, NextPageTemplate, PageBreak, Image
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

class DocumentationGenerator:
    def __init__(self, project_root):
        self.project_root = project_root
        self.styles = getSampleStyleSheet()
        self.custom_style()
        self.version = "1.0.0"
        self.release_date = "2024-01-15"
        
    def custom_style(self):
        """Create custom styles for the document"""
        self.styles.add(ParagraphStyle(
            name='CoverTitle',
            parent=self.styles['Heading1'],
            fontSize=32,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#2F89FC')
        ))
        
        self.styles.add(ParagraphStyle(
            name='CoverInfo',
            parent=self.styles['Normal'],
            fontSize=14,
            spaceAfter=20,
            alignment=TA_CENTER
        ))
        
        self.styles.add(ParagraphStyle(
            name='CustomHeading1',
            parent=self.styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            textColor=colors.HexColor('#2F89FC')
        ))
        self.styles.add(ParagraphStyle(
            name='CustomHeading2',
            parent=self.styles['Heading2'],
            fontSize=18,
            spaceAfter=20,
            textColor=colors.HexColor('#1A1A1A')
        ))
        self.styles.add(ParagraphStyle(
            name='FileContent',
            parent=self.styles['Normal'],
            fontSize=10,
            fontName='Courier',
            spaceAfter=12,
            backColor=colors.HexColor('#F5F5F5')
        ))

    def analyze_html_file(self, file_path):
        """Analyze HTML file and extract key information"""
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            soup = BeautifulSoup(content, 'html.parser')
            
            info = {
                'title': soup.title.string if soup.title else 'No title',
                'meta_description': soup.find('meta', {'name': 'description'})['content'] if soup.find('meta', {'name': 'description'}) else 'No description',
                'scripts': [script.get('src', '') for script in soup.find_all('script', src=True)],
                'stylesheets': [link.get('href', '') for link in soup.find_all('link', rel='stylesheet')],
                'sections': [section.name for section in soup.find_all(['header', 'nav', 'main', 'section', 'footer'])]
            }
            return info

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
            "Root Directory: Warcraft3-website\n",
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
            structure.append(f"    📄 {css}")

        # Scripts
        structure.append("\n📁 JavaScript:")
        if os.path.exists(os.path.join(self.project_root, 'js')):
            js_files = os.listdir(os.path.join(self.project_root, 'js'))
            for js in sorted(js_files):
                structure.append(f"    📄 {js}")

        # Sounds
        if os.path.exists(os.path.join(self.project_root, 'sounds')):
            structure.append("\n📁 Sound Assets:")
            sound_files = os.listdir(os.path.join(self.project_root, 'sounds'))
            for sound in sorted(sound_files):
                structure.append(f"    📄 {sound}")

        # Documentation
        structure.append("\n📁 Documentation:")
        if os.path.exists(os.path.join(self.project_root, 'documentation')):
            doc_files = [f for f in os.listdir(os.path.join(self.project_root, 'documentation')) 
                        if f != 'generate_docs.py']
            for doc in sorted(doc_files):
                structure.append(f"    📄 {doc}")

        return structure

    def header_footer(self, canvas, doc):
        """Add header and footer to each page"""
        canvas.saveState()
        
        # Header
        canvas.setFont('Helvetica', 9)
        canvas.drawString(72, 800, "Warcraft III Website - Technical Documentation")
        canvas.drawRightString(540, 800, f"Version {self.version}")
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
        Version: {self.version}
        Initial Release Date: {self.release_date}
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
        doc_path = os.path.join(self.project_root, 'documentation', 'technical_documentation.pdf')
        
        # Create document with templates
        doc = SimpleDocTemplate(
            doc_path,
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
        print(f"Documentation generated successfully at: {doc_path}")

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
        """Create user interface design section"""
        elements = []
        
        # Design Philosophy
        elements.append(Paragraph("Design Philosophy", self.styles['CustomHeading2']))
        design_text = """
        The user interface follows a game-themed design language while maintaining modern web standards:
        • Dark theme with accent colors matching Warcraft III's aesthetic
        • Responsive grid layout using Bootstrap's container system
        • Interactive elements with hover effects and animations
        • Consistent typography using Google Fonts (Abyssinica SIL and Raleway)
        """
        elements.append(Paragraph(design_text, self.styles['Normal']))
        elements.append(Spacer(1, 0.2*inch))

        # Navigation Structure
        elements.append(Paragraph("Navigation Structure", self.styles['CustomHeading2']))
        nav_text = """
        The website features an intuitive navigation system:
        • Main navigation bar with dropdown menus
        • Sidebar navigation for story content
        • Breadcrumb navigation for deep content
        • Footer quick links for easy access
        """
        elements.append(Paragraph(nav_text, self.styles['Normal']))
        
        return elements

    def create_technical_implementation(self):
        """Create technical implementation section"""
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

        # Code Organization
        elements.append(Paragraph("Code Organization", self.styles['CustomHeading2']))
        code_org = """
        The codebase is organized following best practices:
        • Separate concerns (HTML, CSS, JavaScript)
        • Modular CSS with component-specific styles
        • Responsive images with proper optimization
        • Semantic HTML structure
        • Progressive enhancement approach
        """
        elements.append(Paragraph(code_org, self.styles['Normal']))
        
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

if __name__ == '__main__':
    # Get the project root directory (assuming this script is in the documentation folder)
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Create documentation folder if it doesn't exist
    doc_folder = os.path.join(project_root, 'documentation')
    os.makedirs(doc_folder, exist_ok=True)
    
    # Generate documentation
    generator = DocumentationGenerator(project_root)
    generator.create_pdf()
