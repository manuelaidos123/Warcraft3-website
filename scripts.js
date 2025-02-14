// Constants and configurations
const CONFIG = Object.freeze({
    EMAIL_REGEX: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
    ALERT_DURATION: 3000,
    ALLOWED_HTML_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'button']
});

// Utility functions
const utils = {
    validateEmail(email) {
        return typeof email === 'string' && CONFIG.EMAIL_REGEX.test(email);
    },
    
    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.textContent;
    },
    
    createSafeElement(type, content, attributes = {}) {
        const element = document.createElement(type);
        element.textContent = content;
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        return element;
    },
    
    showAlert(type, message) {
        if (!['success', 'danger', 'warning', 'info'].includes(type)) {
            type = 'info';
        }
        
        const alertContainer = document.querySelector('.alert-container');
        if (!alertContainer) {
            console.error('Alert container not found');
            return;
        }
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.setAttribute('role', 'alert');
        
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        alertDiv.appendChild(messageSpan);
        
        const closeButton = document.createElement('button');
        closeButton.className = 'btn-close';
        closeButton.setAttribute('type', 'button');
        closeButton.setAttribute('data-bs-dismiss', 'alert');
        closeButton.setAttribute('aria-label', 'Close');
        alertDiv.appendChild(closeButton);
        
        alertContainer.appendChild(alertDiv);
        
        setTimeout(() => {
            if (alertDiv && alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, CONFIG.ALERT_DURATION);
    }
};

// Utility function to safely create HTML elements
function createElement(tag, attributes = {}, textContent = '') {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });
    if (textContent) {
        element.textContent = textContent;
    }
    return element;
}

// Safe HTML sanitizer
function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.textContent;
}

// Characters data store
const charactersData = []; // Will be populated from API/database

// Event handlers with proper error handling
function handleEmailSubmission(event) {
    event.preventDefault();
    // Add your email submission handling logic here
}

// Render characters to grid
function renderCharacters(charactersList) {
    const container = document.getElementById('characters-container');
    if (!container) return;
    
    container.innerHTML = ''; // Clear existing content
    const row = createElement('div', { class: 'row g-4' });
    
    charactersList.forEach(character => {
        const card = createCharacterCard(character);
        row.appendChild(card);
    });
    
    container.appendChild(row);
}
