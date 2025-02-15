// Constants and configurations
const CONFIG = {
    EMAIL_REGEX: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
    ALERT_DURATION: 3000
};

// Utility functions
const utils = {
    validateEmail(email) {
        return CONFIG.EMAIL_REGEX.test(email);
    },
    
    showAlert(type, message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        document.querySelector('.alert-container').appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), CONFIG.ALERT_DURATION);
    }
};

// Event handlers
function handleEmailSubmission(event) {
    event?.preventDefault();
    const emailInput = document.querySelector('input[type="email"]');
    const email = emailInput?.value.trim();
    
    if (!email) {
        utils.showAlert('danger', 'Please enter an email address.');
        return;
    }
    
    if (utils.validateEmail(email)) {
        utils.showAlert('success', 'Thank you for subscribing!');
        emailInput.value = '';
    } else {
        utils.showAlert('danger', 'Please enter a valid email address.');
    }
}

// Initialize components
function initializeComponents() {
    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));

    // Add event listeners
    const emailForm = document.querySelector('#subscribeForm');
    emailForm?.addEventListener('submit', handleEmailSubmission);
}

// DOM ready handler
document.addEventListener('DOMContentLoaded', initializeComponents);
