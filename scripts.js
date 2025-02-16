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
    try {
        event?.preventDefault();
        
        const emailInput = document.querySelector('input[type="email"]');
        if (!emailInput) {
            throw new Error('Email input not found');
        }
        
        const email = emailInput.value.trim();
        if (!utils.validateEmail(email)) {
            utils.showAlert('danger', 'Please enter a valid email address');
            return;
        }
        
        processEmailSubmission(email).catch(error => {
            utils.showAlert('danger', 'Failed to process email submission');
            console.error('Email submission error:', error);
        });
    } catch (error) {
        console.error('Email submission handler error:', error);
        utils.showAlert('danger', 'An unexpected error occurred');
    }
}

async function processEmailSubmission(email) {
    const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content
        },
        body: JSON.stringify({ email })
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

// Character rendering functions
function createCharacterCard(character) {
    const cardDiv = createElement('div', { class: 'col-md-3' });
    const card = createElement('div', { 
        class: 'card h-100',
        'data-character': sanitizeHTML(character.name)
    });
    
    const img = createElement('img', {
        class: 'card-img-top',
        src: sanitizeHTML(character.image),
        alt: sanitizeHTML(character.name)
    });
    
    const cardBody = createElement('div', { class: 'card-body' });
    const title = createElement('h5', { class: 'card-title' }, character.name);
    const text = createElement('p', { class: 'card-text' }, character.faction);
    
    const button = createElement('button', { class: 'btn btn-primary' }, 'View Details');
    button.addEventListener('click', () => showCharacterDetails(character.name));
    
    cardBody.append(title, text, button);
    card.append(img, cardBody);
    cardDiv.appendChild(card);
    
    return cardDiv;
}

// Initialize components with proper Bootstrap loading check
function initializeComponents() {
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap is not loaded');
        return;
    }

    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));

    // Add event listeners
    const emailForm = document.querySelector('#subscribeForm');
    emailForm?.addEventListener('submit', handleEmailSubmission);

    // Initialize modals safely
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        new bootstrap.Modal(modal, {
            keyboard: true,
            backdrop: true
        });
    });
}

// DOM ready handler
document.addEventListener('DOMContentLoaded', initializeComponents);

// Character page functionality
function initializeCharacterPage() {
    const factionFilter = document.getElementById('faction-filter');
    const roleFilter = document.getElementById('role-filter');
    const searchInput = document.getElementById('character-search');
    
    if (!factionFilter || !roleFilter || !searchInput) return;
    
    // Add event listeners for filters
    factionFilter.addEventListener('change', filterCharacters);
    roleFilter.addEventListener('change', filterCharacters);
    searchInput.addEventListener('input', filterCharacters);
    
    // Initial render
    renderCharacters(charactersData);

    // Add global modal cleanup
    document.addEventListener('hidden.bs.modal', function (event) {
        if (event.target.id === 'characterModal') {
            const modalBody = event.target.querySelector('.modal-body');
            if (modalBody) {
                modalBody.innerHTML = '';
            }
        }
    });
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

// Filter characters based on current filter values
function filterCharacters(searchTerm = '', faction = '', role = '') {
    if (!Array.isArray(charactersData)) return [];
    
    return charactersData.filter(character => {
        const matchesSearch = character.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFaction = !faction || character.faction.toLowerCase() === faction.toLowerCase();
        const matchesRole = !role || character.role.toLowerCase() === role.toLowerCase();
        return matchesSearch && matchesFaction && matchesRole;
    });
}

// Show character details in modal
function showCharacterDetails(characterName) {
    const character = charactersData.find(c => c.name === characterName);
    if (!character) return;
    
    const detailsContainer = createElement('div', { 
        class: 'character-details',
        id: `details-${sanitizeHTML(character.name)}`
    });
    
    const content = createElement('div', { class: 'row' });
    
    // Create image column
    const imgCol = createElement('div', { class: 'col-md-4' });
    const img = createElement('img', {
        src: sanitizeHTML(character.image),
        alt: sanitizeHTML(character.name),
        class: 'img-fluid'
    });
    imgCol.appendChild(img);
    
    // Create info column
    const infoCol = createElement('div', { class: 'col-md-8' });
    const name = createElement('h3', {}, character.name);
    const faction = createElement('span', { class: 'badge bg-primary' }, character.faction);
    
    infoCol.append(name, faction);
    content.append(imgCol, infoCol);
    detailsContainer.appendChild(content);
    
    // Insert details into DOM safely
    const characterCard = document.querySelector(`[data-character="${sanitizeHTML(characterName)}"]`);
    if (!characterCard) return;
    
    const existingDetails = document.querySelector('.character-details');
    if (existingDetails) {
        existingDetails.remove();
    }
    
    characterCard.closest('.row').after(detailsContainer);
}

// Initialize components with proper Bootstrap loading check
function initializeComponents() {
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap is not loaded');
        return;
    }

    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));

    // Add event listeners
    const emailForm = document.querySelector('#subscribeForm');
    emailForm?.addEventListener('submit', handleEmailSubmission);

    // Initialize modals safely
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        new bootstrap.Modal(modal, {
            keyboard: true,
            backdrop: true
        });
    });
}

// DOM ready handler
document.addEventListener('DOMContentLoaded', initializeComponents);

// Character page functionality
function initializeCharacterPage() {
    const factionFilter = document.getElementById('faction-filter');
    const roleFilter = document.getElementById('role-filter');
    const searchInput = document.getElementById('character-search');
    
    if (!factionFilter || !roleFilter || !searchInput) return;
    
    // Add event listeners for filters
    factionFilter.addEventListener('change', filterCharacters);
    roleFilter.addEventListener('change', filterCharacters);
    searchInput.addEventListener('input', filterCharacters);
    
    // Initial render
    renderCharacters(charactersData);

    // Add global modal cleanup
    document.addEventListener('hidden.bs.modal', function (event) {
        if (event.target.id === 'characterModal') {
            const modalBody = event.target.querySelector('.modal-body');
            if (modalBody) {
                modalBody.innerHTML = '';
            }
        }
    });
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

// Filter characters based on current filter values
function filterCharacters(searchTerm = '', faction = '', role = '') {
    if (!Array.isArray(charactersData)) return [];
    
    return charactersData.filter(character => {
        const matchesSearch = character.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFaction = !faction || character.faction.toLowerCase() === faction.toLowerCase();
        const matchesRole = !role || character.role.toLowerCase() === role.toLowerCase();
        return matchesSearch && matchesFaction && matchesRole;
    });
}

// Show character details in modal
function showCharacterDetails(characterName) {
    const character = charactersData.find(c => c.name === characterName);
    if (!character) return;
    
    const detailsContainer = createElement('div', { 
        class: 'character-details',
        id: `details-${sanitizeHTML(character.name)}`
    });
    
    const content = createElement('div', { class: 'row' });
    
    // Create image column
    const imgCol = createElement('div', { class: 'col-md-4' });
    const img = createElement('img', {
        src: sanitizeHTML(character.image),
        alt: sanitizeHTML(character.name),
        class: 'img-fluid'
    });
    imgCol.appendChild(img);
    
    // Create info column
    const infoCol = createElement('div', { class: 'col-md-8' });
    const name = createElement('h3', {}, character.name);
    const faction = createElement('span', { class: 'badge bg-primary' }, character.faction);
    
    infoCol.append(name, faction);
    content.append(imgCol, infoCol);
    detailsContainer.appendChild(content);
    
    // Insert details into DOM safely
    const characterCard = document.querySelector(`[data-character="${sanitizeHTML(characterName)}"]`);
    if (!characterCard) return;
    
    const existingDetails = document.querySelector('.character-details');
    if (existingDetails) {
        existingDetails.remove();
    }
    
    characterCard.closest('.row').after(detailsContainer);
}

// Initialize components with proper Bootstrap loading check
function initializeComponents() {
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap is not loaded');
        return;
    }

    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));

    // Add event listeners
    const emailForm = document.querySelector('#subscribeForm');
    emailForm?.addEventListener('submit', handleEmailSubmission);

    // Initialize modals safely
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        new bootstrap.Modal(modal, {
            keyboard: true,
            backdrop: true
        });
    });
}

// DOM ready handler
document.addEventListener('DOMContentLoaded', initializeComponents);

// Character page functionality
function initializeCharacterPage() {
    const factionFilter = document.getElementById('faction-filter');
    const roleFilter = document.getElementById('role-filter');
    const searchInput = document.getElementById('character-search');
    
    if (!factionFilter || !roleFilter || !searchInput) return;
    
    // Add event listeners for filters
    factionFilter.addEventListener('change', filterCharacters);
    roleFilter.addEventListener('change', filterCharacters);
    searchInput.addEventListener('input', filterCharacters);
    
    // Initial render
    renderCharacters(charactersData);

    // Add global modal cleanup
    document.addEventListener('hidden.bs.modal', function (event) {
        if (event.target.id === 'characterModal') {
            const modalBody = event.target.querySelector('.modal-body');
            if (modalBody) {
                modalBody.innerHTML = '';
            }
        }
    });
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

// Filter characters based on current filter values
function filterCharacters(searchTerm = '', faction = '', role = '') {
    if (!Array.isArray(charactersData)) return [];
    
    return charactersData.filter(character => {
        const matchesSearch = character.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFaction = !faction || character.faction.toLowerCase() === faction.toLowerCase();
        const matchesRole = !role || character.role.toLowerCase() === role.toLowerCase();
        return matchesSearch && matchesFaction && matchesRole;
    });
}

// Show character details in modal
function showCharacterDetails(characterName) {
    const character = charactersData.find(c => c.name === characterName);
    if (!character) return;
    
    const detailsContainer = createElement('div', { 
        class: 'character-details',
        id: `details-${sanitizeHTML(character.name)}`
    });
    
    const content = createElement('div', { class: 'row' });
    
    // Create image column
    const imgCol = createElement('div', { class: 'col-md-4' });
    const img = createElement('img', {
        src: sanitizeHTML(character.image),
        alt: sanitizeHTML(character.name),
        class: 'img-fluid'
    });
    imgCol.appendChild(img);
    
    // Create info column
    const infoCol = createElement('div', { class: 'col-md-8' });
    const name = createElement('h3', {}, character.name);
    const faction = createElement('span', { class: 'badge bg-primary' }, character.faction);
    
    infoCol.append(name, faction);
    content.append(imgCol, infoCol);
    detailsContainer.appendChild(content);
    
    // Insert details into DOM safely
    const characterCard = document.querySelector(`[data-character="${sanitizeHTML(characterName)}"]`);
    if (!characterCard) return;
    
    const existingDetails = document.querySelector('.character-details');
    if (existingDetails) {
        existingDetails.remove();
    }
    
    characterCard.closest('.row').after(detailsContainer);
}

// Initialize components with proper Bootstrap loading check
function initializeComponents() {
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap is not loaded');
        return;
    }

    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));

    // Add event listeners
    const emailForm = document.querySelector('#subscribeForm');
    emailForm?.addEventListener('submit', handleEmailSubmission);

    // Initialize modals safely
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        new bootstrap.Modal(modal, {
            keyboard: true,
            backdrop: true
        });
    });
}

// DOM ready handler
document.addEventListener('DOMContentLoaded', initializeComponents);

// Character page functionality
function initializeCharacterPage() {
    const factionFilter = document.getElementById('faction-filter');
    const roleFilter = document.getElementById('role-filter');
    const searchInput = document.getElementById('character-search');
    
    if (!factionFilter || !roleFilter || !searchInput) return;
    
    // Add event listeners for filters
    factionFilter.addEventListener('change', filterCharacters);
    roleFilter.addEventListener('change', filterCharacters);
    searchInput.addEventListener('input', filterCharacters);
    
    // Initial render
    renderCharacters(charactersData);

    // Add global modal cleanup
    document.addEventListener('hidden.bs.modal', function (event) {
        if (event.target.id === 'characterModal') {
            const modalBody = event.target.querySelector('.modal-body');
            if (modalBody) {
                modalBody.innerHTML = '';
            }
        }
    });
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

// Filter characters based on current filter values
function filterCharacters(searchTerm = '', faction = '', role = '') {
    if (!Array.isArray(charactersData)) return [];
    
    return charactersData.filter(character => {
        const matchesSearch = character.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFaction = !faction || character.faction.toLowerCase() === faction.toLowerCase();
        const matchesRole = !role || character.role.toLowerCase() === role.toLowerCase();
        return matchesSearch && matchesFaction && matchesRole;
    });
}

// Show character details in modal
function showCharacterDetails(characterName) {
    const character = charactersData.find(c => c.name === characterName);
    if (!character) return;
    
    const detailsContainer = createElement('div', { 
        class: 'character-details',
        id: `details-${sanitizeHTML(character.name)}`
    });
    
    const content = createElement('div', { class: 'row' });
    
    // Create image column
    const imgCol = createElement('div', { class: 'col-md-4' });
    const img = createElement('img', {
        src: sanitizeHTML(character.image),
        alt: sanitizeHTML(character.name),
        class: 'img-fluid'
    });
    imgCol.appendChild(img);
    
    // Create info column
    const infoCol = createElement('div', { class: 'col-md-8' });
    const name = createElement('h3', {}, character.name);
    const faction = createElement('span', { class: 'badge bg-primary' }, character.faction);
    
    infoCol.append(name, faction);
    content.append(imgCol, infoCol);
    detailsContainer.appendChild(content);
    
    // Insert details into DOM safely
    const characterCard = document.querySelector(`[data-character="${sanitizeHTML(characterName)}"]`);
    if (!characterCard) return;
    
    const existingDetails = document.querySelector('.character-details');
    if (existingDetails) {
        existingDetails.remove();
    }
    
    characterCard.closest('.row').after(detailsContainer);
}

// Initialize components with proper Bootstrap loading check
function initializeComponents() {
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap is not loaded');
        return;
    }

    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));

    // Add event listeners
    const emailForm = document.querySelector('#subscribeForm');
    emailForm?.addEventListener('submit', handleEmailSubmission);

    // Initialize modals safely
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        new bootstrap.Modal(modal, {
            keyboard: true,
            backdrop: true
        });
    });
}

// DOM ready handler
document.addEventListener('DOMContentLoaded', initializeComponents);

// Character page functionality
function initializeCharacterPage() {
    const factionFilter = document.getElementById('faction-filter');
    const roleFilter = document.getElementById('role-filter');
    const searchInput = document.getElementById('character-search');
    
    if (!factionFilter || !roleFilter || !searchInput) return;
    
    // Add event listeners for filters
    factionFilter.addEventListener('change', filterCharacters);
    roleFilter.addEventListener('change', filterCharacters);
    searchInput.addEventListener('input', filterCharacters);
    
    // Initial render
    renderCharacters(charactersData);

    // Add global modal cleanup
    document.addEventListener('hidden.bs.modal', function (event) {
        if (event.target.id === 'characterModal') {
            const modalBody = event.target.querySelector('.modal-body');
            if (modalBody) {
                modalBody.innerHTML = '';
            }
        }
    });
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

// Filter characters based on current filter values
function filterCharacters(searchTerm = '', faction = '', role = '') {
    if (!Array.isArray(charactersData)) return [];
    
    return charactersData.filter(character => {
        const matchesSearch = character.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFaction = !faction || character.faction.toLowerCase() === faction.toLowerCase();
        const matchesRole = !role || character.role.toLowerCase() === role.toLowerCase();
        return matchesSearch && matchesFaction && matchesRole;
    });
}

// Show character details in modal
function showCharacterDetails(characterName) {
    const character = charactersData.find(c => c.name === characterName);
    if (!character) return;
    
    const detailsContainer = createElement('div', { 
        class: 'character-details',
        id: `details-${sanitizeHTML(character.name)}`
    });
    
    const content = createElement('div', { class: 'row' });
    
    // Create image column
    const imgCol = createElement('div', { class: 'col-md-4' });
    const img = createElement('img', {
        src: sanitizeHTML(character.image),
        alt: sanitizeHTML(character.name),
        class: 'img-fluid'
    });
    imgCol.appendChild(img);
    
    // Create info column
    const infoCol = createElement('div', { class: 'col-md-8' });
    const name = createElement('h3', {}, character.name);
    const faction = createElement('span', { class: 'badge bg-primary' }, character.faction);
    
    infoCol.append(name, faction);
    content.append(imgCol, infoCol);
    detailsContainer.appendChild(content);
    
    // Insert details into DOM safely
    const characterCard = document.querySelector(`[data-character="${sanitizeHTML(characterName)}"]`);
    if (!characterCard) return;
    
    const existingDetails = document.querySelector('.character-details');
    if (existingDetails) {
        existingDetails.remove();
    }
    
    characterCard.closest('.row').after(detailsContainer);
}

// Initialize components with proper Bootstrap loading check
function initializeComponents() {
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap is not loaded');
        return;
    }

    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));

    // Add event listeners
    const emailForm = document.querySelector('#subscribeForm');
    emailForm?.addEventListener('submit', handleEmailSubmission);

    // Initialize modals safely
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        new bootstrap.Modal(modal, {
            keyboard: true,
            backdrop: true
        });
    });
}

// DOM ready handler
document.addEventListener('DOMContentLoaded', initializeComponents);

// Character page functionality
function initializeCharacterPage() {
    const factionFilter = document.getElementById('faction-filter');
    const roleFilter = document.getElementById('role-filter');
    const searchInput = document.getElementById('character-search');
    
    if (!factionFilter || !roleFilter || !searchInput) return;
    
    // Add event listeners for filters
    factionFilter.addEventListener('change', filterCharacters);
    roleFilter.addEventListener('change', filterCharacters);
    searchInput.addEventListener('input', filterCharacters);
    
    // Initial render
    renderCharacters(charactersData);

    // Add global modal cleanup
    document.addEventListener('hidden.bs.modal', function (event) {
        if (event.target.id === 'characterModal') {
            const modalBody = event.target.querySelector('.modal-body');
            if (modalBody) {
                modalBody.innerHTML = '';
            }
        }
    });
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

// Filter characters based on current filter values
function filterCharacters(searchTerm = '', faction = '', role = '') {
    if (!Array.isArray(charactersData)) return [];
    
    return charactersData.filter(character => {
        const matchesSearch = character.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFaction = !faction || character.faction.toLowerCase() === faction.toLowerCase();
        const matchesRole = !role || character.role.toLowerCase() === role.toLowerCase();
        return matchesSearch && matchesFaction && matchesRole;
    });
}

// Show character details in modal
function showCharacterDetails(characterName) {
    const character = charactersData.find(c => c.name === characterName);
    if (!character) return;
    
    const detailsContainer = createElement('div', { 
        class: 'character-details',
        id: `details-${sanitizeHTML(character.name)}`
    });
    
    const content = createElement('div', { class: 'row' });
    
    // Create image column
    const imgCol = createElement('div', { class: 'col-md-4' });
    const img = createElement('img', {
        src: sanitizeHTML(character.image),
        alt: sanitizeHTML(character.name),
        class: 'img-fluid'
    });
    imgCol.appendChild(img);
    
    // Create info column
    const infoCol = createElement('div', { class: 'col-md-8' });
    const name = createElement('h3', {}, character.name);
    const faction = createElement('span', { class: 'badge bg-primary' }, character.faction);
    
    infoCol.append(name, faction);
    content.append(imgCol, infoCol);
    detailsContainer.appendChild(content);
    
    // Insert details into DOM safely
    const characterCard = document.querySelector(`[data-character="${sanitizeHTML(characterName)}"]`);
    if (!characterCard) return;
    
    const existingDetails = document.querySelector('.character-details');
    if (existingDetails) {
        existingDetails.remove();
    }
    
    characterCard.closest('.row').after(detailsContainer);
}

// Initialize components with proper Bootstrap loading check
function initializeComponents() {
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap is not loaded');
        return;
    }

    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));

    // Add event listeners
    const emailForm = document.querySelector('#subscribeForm');
    emailForm?.addEventListener('submit', handleEmailSubmission);

    // Initialize modals safely
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        new bootstrap.Modal(modal, {
            keyboard: true,
            backdrop: true
        });
    });
}

// DOM ready handler
document.addEventListener('DOMContentLoaded', initializeComponents);

// Character page functionality
function initializeCharacterPage() {
    const factionFilter = document.getElementById('faction-filter');
    const roleFilter = document.getElementById('role-filter');
    const searchInput = document.getElementById('character-search');
    
    if (!factionFilter || !roleFilter || !searchInput) return;
    
    // Add event listeners for filters
    factionFilter.addEventListener('change', filterCharacters);
    roleFilter.addEventListener('change', filterCharacters);
    searchInput.addEventListener('input', filterCharacters);
    
    // Initial render
    renderCharacters(charactersData);

    // Add global modal cleanup
    document.addEventListener('hidden.bs.modal', function (event) {
        if (event.target.id === 'characterModal') {
            const modalBody = event.target.querySelector('.modal-body');
            if (modalBody) {
                modalBody.innerHTML = '';
            }
        }
    });
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

// Filter characters based on current filter values
function filterCharacters(searchTerm = '', faction = '', role = '') {
    if (!Array.isArray(charactersData)) return [];
    
    return charactersData.filter(character => {
        const matchesSearch = character.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFaction = !faction || character.faction.toLowerCase() === faction.toLowerCase();
        const matchesRole = !role || character.role.toLowerCase() === role.toLowerCase();
        return matchesSearch && matchesFaction && matchesRole;
    });
}

// Show character details in modal
function showCharacterDetails(characterName) {
    const character = charactersData.find(c => c.name === characterName);
    if (!character) return;
    
    const detailsContainer = createElement('div', { 
        class: 'character-details',
        id: `details-${sanitizeHTML(character.name)}`
    });
    
    const content = createElement('div', { class: 'row' });
    
    // Create image column
    const imgCol = createElement('div', { class: 'col-md-4' });
    const img = createElement('img', {
        src: sanitizeHTML(character.image),
        alt: sanitizeHTML(character.name),
        class: 'img-fluid'
    });
    imgCol.appendChild(img);
    
    // Create info column
    const infoCol = createElement('div', { class: 'col-md-8' });
    const name = createElement('h3', {}, character.name);
    const faction = createElement('span', { class: 'badge bg-primary' }, character.faction);
    
    infoCol.append(name, faction);
    content.append(imgCol, infoCol);
    detailsContainer.appendChild(content);
    
    // Insert details into DOM safely
    const characterCard = document.querySelector(`[data-character="${sanitizeHTML(characterName)}"]`);
    if (!characterCard) return;
    
    const existingDetails = document.querySelector('.character-details');
    if (existingDetails) {
        existingDetails.remove();
    }
    
    characterCard.closest('.row').after(detailsContainer);
}

// Initialize components with proper Bootstrap loading check
function initializeComponents() {
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap is not loaded');
        return;
    }

    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));

    // Add event listeners
    const emailForm = document.querySelector('#subscribeForm');
    emailForm?.addEventListener('submit', handleEmailSubmission);

    // Initialize modals safely
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        new bootstrap.Modal(modal, {
            keyboard: true,
            backdrop: true
        });
    });
}

// DOM ready handler
document.addEventListener('DOMContentLoaded', initializeComponents);

// Character page functionality
function initializeCharacterPage() {
    const factionFilter = document.getElementById('faction-filter');
    const roleFilter = document.getElementById('role-filter');
    const searchInput = document.getElementById('character-search');
    
    if (!factionFilter || !roleFilter || !searchInput) return;
    
    // Add event listeners for filters
    factionFilter.addEventListener('change', filterCharacters);
    roleFilter.addEventListener('change', filterCharacters);
    searchInput.addEventListener('input', filterCharacters);
    
    // Initial render
    renderCharacters(charactersData);

    // Add global modal cleanup
    document.addEventListener('hidden.bs.modal', function (event) {
        if (event.target.id === 'characterModal') {
            const modalBody = event.target.querySelector('.modal-body');
            if (modalBody) {
                modalBody.innerHTML = '';
            }
        }
    });
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

// Filter characters based on current filter values
function filterCharacters(searchTerm = '', faction = '', role = '') {
    if (!Array.isArray(charactersData)) return [];
    
    return charactersData.filter(character => {
        const matchesSearch = character.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFaction = !faction || character.faction.toLowerCase() === faction.toLowerCase();
        const matchesRole = !role || character.role.toLowerCase() === role.toLowerCase();
        return matchesSearch && matchesFaction && matchesRole;
    });
}

// Show character details in modal
function showCharacterDetails(characterName) {
    const character = charactersData.find(c => c.name === characterName);
    if (!character) return;
    
    const detailsContainer = createElement('div', { 
        class: 'character-details',
        id: `details-${sanitizeHTML(character.name)}`
    });
    
    const content = createElement('div', { class: 'row' });
    
    // Create image column
    const imgCol = createElement('div', { class: 'col-md-4' });
    const img = createElement('img', {
        src: sanitizeHTML(character.image),
        alt: sanitizeHTML(character.name),
        class: 'img-fluid'
    });
    imgCol.appendChild(img);
    
    // Create info column
    const infoCol = createElement('div', { class: 'col-md-8' });
    const name = createElement('h3', {}, character.name);
    const faction = createElement('span', { class: 'badge bg-primary' }, character.faction);
    
    infoCol.append(name, faction);
    content.append(imgCol, infoCol);
    detailsContainer.appendChild(content);
    
    // Insert details into DOM safely
    const characterCard = document.querySelector(`[data-character="${sanitizeHTML(characterName)}"]`);
    if (!characterCard) return;
    
    const existingDetails = document.querySelector('.character-details');
    if (existingDetails) {
        existingDetails.remove();
    }
    
    characterCard.closest('.row').after(detailsContainer);
}

// Initialize components with proper Bootstrap loading check
function initializeComponents() {
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap is not loaded');
        return;
    }

    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));

    // Add event listeners
    const emailForm = document.querySelector('#subscribeForm');
    emailForm?.addEventListener('submit', handleEmailSubmission);

    // Initialize modals safely
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        new bootstrap.Modal(modal, {
            keyboard: true,
            backdrop: true
        });
    });
}

// DOM ready handler
document.addEventListener('DOMContentLoaded', initializeComponents);

// Character page functionality
function initializeCharacterPage() {
    const factionFilter = document.getElementById('faction-filter');
    const roleFilter = document.getElementById('role-filter');
    const searchInput = document.getElementById('character-search');
    
    if (!factionFilter || !roleFilter || !searchInput) return;
    
    // Add event listeners for filters
    factionFilter.addEventListener('change', filterCharacters);
    roleFilter.addEventListener('change', filterCharacters);
    searchInput.addEventListener('input', filterCharacters);
    
    // Initial render
    renderCharacters(charactersData);

    // Add global modal cleanup
    document.addEventListener('hidden.bs.modal', function (event) {
        if (event.target.id === 'characterModal') {
            const modalBody = event.target.querySelector('.modal-body');
            if (modalBody) {
                modalBody.innerHTML = '';
            }
        }
    });
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

// Filter characters based on current filter values
function filterCharacters(searchTerm = '', faction = '', role = '') {
    if (!Array.isArray(charactersData)) return [];
    
    return charactersData.filter(character => {
        const matchesSearch = character.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFaction = !faction || character.faction.toLowerCase() === faction.toLowerCase();
        const matchesRole = !role || character.role.toLowerCase() === role.toLowerCase();
        return matchesSearch && matchesFaction && matchesRole;
    });
}

// Show character details in modal
function showCharacterDetails(characterName) {
    const character = charactersData.find(c => c.name === characterName);
    if (!character) return;
    
    const detailsContainer = createElement('div', { 
        class: 'character-details',
        id: `details-${sanitizeHTML(character.name)}`
    });
    
    const content = createElement('div', { class: 'row' });
    
    // Create image column
    const imgCol = createElement('div', { class: 'col-md-4' });
    const img = createElement('img', {
        src: sanitizeHTML(character.image),
        alt: sanitizeHTML(character.name),
        class: 'img-fluid'
    });
    imgCol.appendChild(img);
    
    // Create info column
    const infoCol = createElement('div', { class: 'col-md-8' });
    const name = createElement('h3', {}, character.name);
    const faction = createElement('span', { class: 'badge bg-primary' }, character.faction);
    
    infoCol.append(name, faction);
    content.append(imgCol, infoCol);
    detailsContainer.appendChild(content);
    
    // Insert details into DOM safely
    const characterCard = document.querySelector(`[data-character="${sanitizeHTML(characterName)}"]`);
    if (!characterCard) return;
    
    const existingDetails = document.querySelector('.character-details');
    if (existingDetails) {
        existingDetails.remove();
    }
    
    characterCard.closest('.row').after(detailsContainer);
}

// Initialize components with proper Bootstrap loading check
function initializeComponents() {
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap is not loaded');
        return;
    }

    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));

    // Add event listeners
    const emailForm = document.querySelector('#subscribeForm');
    emailForm?.addEventListener('submit', handleEmailSubmission);

    // Initialize modals safely
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        new bootstrap.Modal(modal, {
            keyboard: true,
            backdrop: true
        });
    });
}

// DOM ready handler
document.addEventListener('DOMContentLoaded', initializeComponents);

// Character page functionality
function initializeCharacterPage() {
    const factionFilter = document.getElementById('faction-filter');
    const roleFilter = document.getElementById('role-filter');
    const searchInput = document.getElementById('character-search');
    
    if (!factionFilter || !roleFilter || !searchInput) return;
    
    // Add event listeners for filters
    factionFilter.addEventListener('change', filterCharacters);
    roleFilter.addEventListener('change', filterCharacters);
    searchInput.addEventListener('input', filterCharacters);
    
    // Initial render
    renderCharacters(charactersData);

    // Add global modal cleanup
    document.addEventListener('hidden.bs.modal', function (event) {
        if (event.target.id === 'characterModal') {
            const modalBody = event.target.querySelector('.modal-body');
            if (modalBody) {
                modalBody.innerHTML = '';
            }
        }
    });
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

// Filter characters based on current filter values
function filterCharacters(searchTerm = '', faction = '', role = '') {
    if (!Array.isArray(charactersData)) return [];
    
    return charactersData.filter(character => {
        const matchesSearch = character.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFaction = !faction || character.faction.toLowerCase() === faction.toLowerCase();
        const matchesRole = !role || character.role.toLowerCase() === role.toLowerCase();
        return matchesSearch && matchesFaction && matchesRole;
    });
}

// Show character details in modal
function showCharacterDetails(characterName) {
    const character = charactersData.find(c => c.name === characterName);
    if (!character) return;
    
    const detailsContainer = createElement('div', { 
        class: 'character-details',
        id: `details-${sanitizeHTML(character.name)}`
    });
    
    const content = createElement('div', { class: 'row' });
    
    // Create image column
    const imgCol = createElement('div', { class: 'col-md-4' });
    const img = createElement('img', {
        src: sanitizeHTML(character.image),
        alt: sanitizeHTML(character.name),
        class: 'img-fluid'
    });
    imgCol.appendChild(img);
    
    // Create info column
    const infoCol = createElement('div', { class: 'col-md-8' });
    const name = createElement('h3', {}, character.name);
    const faction = createElement('span', { class: 'badge bg-primary' }, character.faction);
    
    infoCol.append(name, faction);
    content.append(imgCol, infoCol);
    detailsContainer.appendChild(content);
    
    // Insert details into DOM safely
    const characterCard = document.querySelector(`[data-character="${sanitizeHTML(characterName)}"]`);
    if (!characterCard) return;
    
    const existingDetails = document.querySelector('.character-details');
    if (existingDetails) {
        existingDetails.remove();
    }
    
    characterCard.closest('.row').after(detailsContainer);
}

// Initialize components with proper Bootstrap loading check
function initializeComponents() {
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap is not loaded');
        return;
    }

    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));

    // Add event listeners
    const emailForm = document.querySelector('#subscribeForm');
    emailForm?.addEventListener('submit', handleEmailSubmission);

    // Initialize modals safely
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        new bootstrap.Modal(modal, {
            keyboard: true,
            backdrop: true
        });
    });
}

// DOM ready handler
document.addEventListener('DOMContentLoaded', initializeComponents);

// Character page functionality
function initializeCharacterPage() {
    const factionFilter = document.getElementById('faction-filter');
    const roleFilter = document.getElementById('role-filter');
    const searchInput = document.getElementById('character-search');
    
    if (!factionFilter || !roleFilter || !searchInput) return;
    
    // Add event listeners for filters
    factionFilter.addEventListener('change', filterCharacters);
    roleFilter.addEventListener('change', filterCharacters);
    searchInput.addEventListener('input', filterCharacters);
    
    // Initial render
    renderCharacters(charactersData);

    // Add global modal cleanup
    document.addEventListener('hidden.bs.modal', function (event) {
        if (event.target.id === 'characterModal') {
            const modalBody = event.target.querySelector('.modal-body');
            if (modalBody) {
                modalBody.innerHTML = '';
            }
        }
    });
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

// Filter characters based on current filter values
function filterCharacters(searchTerm = '', faction = '', role = '') {
    if (!Array.isArray(charactersData)) return [];
    
    return charactersData.filter(character => {
        const matchesSearch = character.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFaction = !faction || character.faction.toLowerCase() === faction.toLowerCase();
        const matchesRole = !role || character.role.toLowerCase() === role.toLowerCase();
        return matchesSearch && matchesFaction && matchesRole;
    });
}

// Show character details in modal
function showCharacterDetails(characterName) {
    const character = charactersData.find(c => c.name === characterName);
    if (!character) return;
    
    const detailsContainer = createElement('div', { 
        class: 'character-details',
        id: `details-${sanitizeHTML(character.name)}`
    });
    
    const content = createElement('div', { class: 'row' });
    
    // Create image column
    const imgCol = createElement('div', { class: 'col-md-4' });
    const img = createElement('img', {
        src: sanitizeHTML(character.image),
        alt: sanitizeHTML(character.name),
        class: 'img-fluid'
    });
    imgCol.appendChild(img);
    
    // Create info column
    const infoCol = createElement('div', { class: 'col-md-8' });
    const name = createElement('h3', {}, character.name);
    const faction = createElement('span', { class: 'badge bg-primary' }, character.faction);
    
    infoCol.append(name, faction);
    content.append(imgCol, infoCol);
    detailsContainer.appendChild(content);
    
    // Insert details into DOM safely
    const characterCard = document.querySelector(`[data-character="${sanitizeHTML(characterName)}"]`);
    if (!characterCard) return;
    
    const existingDetails = document.querySelector('.character-details');
    if (existingDetails) {
        existingDetails.remove();
    }
    
    characterCard.closest('.row').after(detailsContainer);
}

// Initialize components with proper Bootstrap loading check
function initializeComponents() {
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap is not loaded');
        return;
    }

    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));

    // Add event listeners
    const emailForm = document.querySelector('#subscribeForm');
    emailForm?.addEventListener('submit', handleEmailSubmission);

    // Initialize modals safely
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        new bootstrap.Modal(modal, {
            keyboard: true,
            backdrop: true
        });
    });
}

// DOM ready handler
document.addEventListener('DOMContentLoaded', initializeComponents);

// Character page functionality
function initializeCharacterPage() {
    const factionFilter = document.getElementById('faction-filter');
    const roleFilter = document.getElementById('role-filter');
    const searchInput = document.getElementById('character-search');
    
    if (!factionFilter || !roleFilter || !searchInput) return;
    
    // Add event listeners for filters
    factionFilter.addEventListener('change', filterCharacters);
    roleFilter.addEventListener('change', filterCharacters);
    searchInput.addEventListener('input', filterCharacters);
    
    // Initial render
    renderCharacters(charactersData);

    // Add global modal cleanup
    document.addEventListener('hidden.bs.modal', function (event) {
        if (event.target.id === 'characterModal') {
            const modalBody = event.target.querySelector('.modal-body');
            if (modalBody) {
                modalBody.innerHTML = '';
            }
        }
    });
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

// Filter characters based on current filter values
function filterCharacters(searchTerm = '', faction = '', role = '') {
    if (!Array.isArray(charactersData)) return [];
    
    return charactersData.filter(character => {
        const matchesSearch = character.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFaction = !faction || character.faction.toLowerCase() === faction.toLowerCase();
        const matchesRole = !role || character.role.toLowerCase() === role.toLowerCase();
        return matchesSearch && matchesFaction && matchesRole;
    });
}

// Show character details in modal
function showCharacterDetails(characterName) {
    const character = charactersData.find(c => c.name === characterName);
    if (!character) return;
    
    const detailsContainer = createElement('div', { 
        class: 'character-details',
        id: `details-${sanitizeHTML(character.name)}`
    });
    
    const content = createElement('div', { class: 'row' });
    
    // Create image column
    const imgCol = createElement('div', { class: 'col-md-4' });
    const img = createElement('img', {
        src: sanitizeHTML(character.image),
        alt: sanitizeHTML(character.name),
        class: 'img-fluid'
    });
    imgCol.appendChild(img);
    
    // Create info column
    const infoCol = createElement('div', { class: 'col-md-8' });
    const name = createElement('h3', {}, character.name);
    const faction = createElement('span', { class: 'badge bg-primary' }, character.faction);
    
    infoCol.append(name, faction);
    content.append(imgCol, infoCol);
    detailsContainer.appendChild(content);
    
    // Insert details into DOM safely
    const characterCard = document.querySelector(`[data-character="${sanitizeHTML(characterName)}"]`);
    if (!characterCard) return;
    
    const existingDetails = document.querySelector('.character-details');
    if (existingDetails) {
        existingDetails.remove();
    }
    
    characterCard.closest('.row').after(detailsContainer);
}

// Initialize components with proper Bootstrap loading check
function initializeComponents() {
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap is not loaded');
        return;
    }

    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));

    // Add event listeners
    const emailForm = document.querySelector('#subscribeForm');
    emailForm?.addEventListener('submit', handleEmailSubmission);

    // Initialize modals safely
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        new bootstrap.Modal(modal, {
            keyboard: true,
            backdrop: true
        });
    });
}

// DOM ready handler
document.addEventListener('DOMContentLoaded', initializeComponents);

// Character page functionality
function initializeCharacterPage() {
    const factionFilter = document.getElementById('faction-filter');
    const roleFilter = document.getElementById('role-filter');
    const searchInput = document.getElementById('character-search');
    
    if (!factionFilter || !roleFilter || !searchInput) return;
    
    // Add event listeners for filters
    factionFilter.addEventListener('change', filterCharacters);
    roleFilter.addEventListener('change', filterCharacters);
    searchInput.addEventListener('input', filterCharacters);
    
    // Initial render
    renderCharacters(charactersData);

    // Add global modal cleanup
    document.addEventListener('hidden.bs.modal', function (event) {
        if (event.target.id === 'characterModal') {
            const modalBody = event.target.querySelector('.modal-body');
            if (modalBody) {
                modalBody.innerHTML = '';
            }
        }
    });
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

// Filter characters based on current filter values
function filterCharacters(searchTerm = '', faction = '', role = '') {
    if (!Array.isArray(charactersData)) return [];
    
    return charactersData.filter(character => {
        const matchesSearch = character.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFaction = !faction || character.faction.toLowerCase() === faction.toLowerCase();
        const matchesRole = !role || character.role.toLowerCase() === role.toLowerCase();
        return matchesSearch && matchesFaction && matchesRole;
    });
}

// Show character details in modal
function showCharacterDetails(characterName) {
    const character = charactersData.find(c => c.name === characterName);
    if (!character) return;
    
    const detailsContainer = createElement('div', { 
        class: 'character-details',
        id: `details-${sanitizeHTML(character.name)}`
    });
    
    const content = createElement('div', { class: 'row' });
    
    // Create image column
    const imgCol = createElement('div', { class: 'col-md-4' });
    const img = createElement('img', {
        src: sanitizeHTML(character.image),
        alt: sanitizeHTML(character.name),
        class: 'img-fluid'
    });
    imgCol.appendChild(img);
    
    // Create info column
    const infoCol = createElement('div', { class: 'col-md-8' });
    const name = createElement('h3', {}, character.name);
    const faction = createElement('span', { class: 'badge bg-primary' }, character.faction);
    
    infoCol.append(name, faction);
    content.append(imgCol, infoCol);
    detailsContainer.appendChild(content);
    
    // Insert details into DOM safely
    const characterCard = document.querySelector(`[data-character="${sanitizeHTML(characterName)}"]`);
    if (!characterCard) return;
    
    const existingDetails = document.querySelector('.character-details');
    if (existingDetails) {
        existingDetails.remove();
    }
    
    characterCard.closest('.row').after(detailsContainer);
}

// Initialize components with proper Bootstrap loading check
function initializeComponents() {
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap is not loaded');
        return;
    }

    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));

    // Add event listeners
    const emailForm = document.querySelector('#subscribeForm');
    emailForm?.addEventListener('submit', handleEmailSubmission);

    // Initialize modals safely
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        new bootstrap.Modal(modal, {
            keyboard: true,
            backdrop: true
        });
    });
}

// DOM ready handler
document.addEventListener('DOMContentLoaded', initializeComponents);

// Character page functionality
function initializeCharacterPage() {
    const factionFilter = document.getElementById('faction-filter');
    const roleFilter = document.getElementById('role-filter');
    const searchInput = document.getElementById('character-search');
    
    if (!factionFilter || !roleFilter || !searchInput) return;
    
    // Add event listeners for filters
    factionFilter.addEventListener('change', filterCharacters);
    roleFilter.addEventListener('change', filterCharacters);
    searchInput.addEventListener('input', filterCharacters);
    
    // Initial render
    renderCharacters(charactersData);

    // Add global modal cleanup
    document.addEventListener('hidden.bs.modal', function (event) {
        if (event.target.id === 'characterModal') {
            const modalBody = event.target.querySelector('.modal-body');
            if (modalBody) {
                modalBody.innerHTML = '';
            }
        }
    });
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

// Filter characters based on current filter values
function filterCharacters(searchTerm = '', faction = '', role = '') {
    if (!Array.isArray(charactersData)) return [];
    
    return charactersData.filter(character => {
        const matchesSearch = character.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFaction = !faction || character.faction.toLowerCase() === faction.toLowerCase();
        const matchesRole = !role || character.role.toLowerCase() === role.toLowerCase();
        return matchesSearch && matchesFaction && matchesRole;
    });
}

// Show character details in modal
function showCharacterDetails(characterName) {
    const character = charactersData.find(c => c.name === characterName);
    if (!character) return;
    
    const detailsContainer = createElement('div', { 
        class: 'character-details',
        id: `details-${sanitizeHTML(character.name)}`
    });
    
    const content = createElement('div', { class: 'row' });
    
    // Create image column
    const imgCol = createElement('div', { class: 'col-md-4' });
    const img = createElement('img', {
        src: sanitizeHTML(character.image),
        alt: sanitizeHTML(character.name),
        class: 'img-fluid'
    });
    imgCol.appendChild(img);
    
    // Create info column
    const infoCol = createElement('div', { class: 'col-md-8' });
    const name = createElement('h3', {}, character.name);
    const faction = createElement('span', { class: 'badge bg-primary' }, character.faction);
    
    infoCol.append(name, faction);
    content.append(imgCol, infoCol);
    detailsContainer.appendChild(content);
    
    // Insert details into DOM safely
    const characterCard = document.querySelector(`[data-character="${sanitizeHTML(characterName)}"]`);
    if (!characterCard) return;
    
    const existingDetails = document.querySelector('.character-details');
    if (existingDetails) {
        existingDetails.remove();
    }
    
    characterCard.closest('.row').after(detailsContainer);
}

// Initialize components with proper Bootstrap loading check
function initializeComponents() {
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap is not loaded');
        return;
    }

    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));

    // Add event listeners
    const emailForm = document.querySelector('#subscribeForm');
    emailForm?.addEventListener('submit', handleEmailSubmission);

    // Initialize modals safely
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        new bootstrap.Modal(modal, {
            keyboard: true,
            backdrop: true
        });
    });
}

// DOM ready handler
document.addEventListener('DOMContentLoaded', initializeComponents);

// Character page functionality
function initializeCharacterPage() {
    const factionFilter = document.getElementById('faction-filter');
    const roleFilter = document.getElementById('role-filter');
    const searchInput = document.getElementById('character-search');
    
    if (!factionFilter || !roleFilter || !searchInput) return;
    
    // Add event listeners for filters
    factionFilter.addEventListener('change', filterCharacters);
    roleFilter.addEventListener('change', filterCharacters);
    searchInput.addEventListener('input', filterCharacters);
    
    // Initial render
    renderCharacters(charactersData);

    // Add global modal cleanup
    document.addEventListener('hidden.bs.modal', function (event) {
        if (event.target.id === 'characterModal') {
            const modalBody = event.target.querySelector('.modal-body');
            if (modalBody) {
                modalBody.innerHTML = '';
            }
        }
    });
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

// Filter characters based on current filter values
function filterCharacters(searchTerm = '', faction = '', role = '') {
    if (!Array.isArray(charactersData)) return [];
    
    return charactersData.filter(character => {
        const matchesSearch = character.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFaction = !faction || character.faction.toLowerCase() === faction.toLowerCase();
        const matchesRole = !role || character.role.toLowerCase() === role.toLowerCase();
        return matchesSearch && matchesFaction && matchesRole;
    });
}

// Show character details in modal
function showCharacterDetails(characterName) {
    const character = charactersData.find(c => c.name === characterName);
    if (!character) return;
    
    const detailsContainer = createElement('div', { 
        class: 'character-details',
        id: `details-${sanitizeHTML(character.name)}`
    });
    
    const content = createElement('div', { class: 'row' });
    
    // Create image column
    const imgCol = createElement('div', { class: 'col-md-4' });
    const img = createElement('img', {
        src: sanitizeHTML(character.image),
        alt: sanitizeHTML(character.name),
        class: 'img-fluid'
    });
    imgCol.appendChild(img);
    
    // Create info column
    const infoCol = createElement('div', { class: 'col-md-8' });
    const name = createElement('h3', {}, character.name);
    const faction = createElement('span', { class: 'badge bg-primary' }, character.faction);
    
    infoCol.append(name, faction);
    content.append(imgCol, infoCol);
    detailsContainer.appendChild(content);
    
    // Insert details into DOM safely
    const characterCard = document.querySelector(`[data-character="${sanitizeHTML(characterName)}"]`);
    if (!characterCard) return;
    
    const existingDetails = document.querySelector('.character-details');
    if (existingDetails) {
        existingDetails.remove();
    }
    
    characterCard.closest('.row').after(detailsContainer);
}

// Initialize components with proper Bootstrap loading check
function initializeComponents() {
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap is not loaded');
        return;
    }

    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));

    // Add event listeners
    const emailForm = document.querySelector('#subscribeForm');
    emailForm?.addEventListener('submit', handleEmailSubmission);

    // Initialize modals safely
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        new bootstrap.Modal(modal, {
            keyboard: true,
            backdrop: true
        });
    });
}

// DOM ready handler
document.addEventListener('DOMContentLoaded', initializeComponents);

// Character page functionality
function initializeCharacterPage() {
    const factionFilter = document.getElementById('faction-filter');
    const roleFilter = document.getElementById('role-filter');
    const searchInput = document.getElementById('character-search');
    
    if (!factionFilter || !roleFilter || !searchInput) return;
    
    // Add event listeners for filters
    factionFilter.addEventListener('change', filterCharacters);
    roleFilter.addEventListener('change', filterCharacters);
    searchInput.addEventListener('input', filterCharacters);
    
    // Initial render
    renderCharacters(charactersData);

    // Add global modal cleanup
    document.addEventListener('hidden.bs.modal', function (event) {
        if (event.target.id === 'characterModal') {
            const modalBody = event.target.querySelector('.modal-body');
            if (modalBody) {
                modalBody.innerHTML = '';
            }
        }
    });
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

// Filter characters based on current filter values
function filterCharacters(searchTerm = '', faction = '', role = '') {
    if (!Array.isArray(charactersData)) return [];
    
    return charactersData.filter(character => {
        const matchesSearch = character.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFaction = !faction || character.faction.toLowerCase() === faction.toLowerCase();
        const matchesRole = !role || character.role.toLowerCase() === role.toLowerCase();
        return matchesSearch && matchesFaction && matchesRole;
    });
}

// Show character details in modal
function showCharacterDetails(characterName) {
    const character = charactersData.find(c => c.name === characterName);
    if (!character) return;
    
    const detailsContainer = createElement('div', { 
        class: 'character-details',
        id: `details-${sanitizeHTML(character.name)}`
    });
    
    const content = createElement('div', { class: 'row' });
    
    // Create image column
    const imgCol = createElement('div', { class: 'col-md-4' });
    const img = createElement('img', {
        src: sanitizeHTML(character.image),
        alt: sanitizeHTML(character.name),
        class: 'img-fluid'
    });
    imgCol.appendChild(img);
    
    // Create info column
    const infoCol = createElement('div', { class: 'col-md-8' });
    const name = createElement('h3', {}, character.name);
    const faction = createElement('span', { class: 'badge bg-primary' }, character.faction);
    
    infoCol.append(name, faction);
    content.append(imgCol, infoCol);
    detailsContainer.appendChild(content);
    
    // Insert details into DOM safely
    const characterCard = document.querySelector(`[data-character="${sanitizeHTML(characterName)}"]`);
    if (!characterCard) return;
    
    const existingDetails = document.querySelector('.character-details');
    if (existingDetails) {
        existingDetails.remove();
    }
    
    characterCard.closest('.row').after(detailsContainer);
}

// Initialize components with proper Bootstrap loading check
function initializeComponents() {
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap is not loaded');
        return;
    }

    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));

    // Add event listeners
    const emailForm = document.querySelector('#subscribeForm');
    emailForm?.addEventListener('submit', handleEmailSubmission);

    // Initialize modals safely
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        new bootstrap.Modal(modal, {
            keyboard: true,
            backdrop: true
        });
    });
}

// DOM ready handler
document.addEventListener('DOMContentLoaded', initializeComponents);

// Character page functionality
function initializeCharacterPage() {
    const factionFilter = document.getElementById('faction-filter');
    const roleFilter = document.getElementById('role-filter');
    const searchInput = document.getElementById('character-search');
    
    if (!factionFilter || !roleFilter || !searchInput) return;
    
    // Add event listeners for filters
    factionFilter.addEventListener('change', filterCharacters);
    roleFilter.addEventListener('change', filterCharacters);
    searchInput.addEventListener('input', filterCharacters);
    
    // Initial render
    renderCharacters(charactersData);

    // Add global modal cleanup
    document.addEventListener('hidden.bs.modal', function (event) {
        if (event.target.id === 'characterModal') {
            const modalBody = event.target.querySelector('.modal-body');
            if (modalBody) {
                modalBody.innerHTML = '';
            }
        }
    });
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

// Filter characters based on current filter values
function filterCharacters(searchTerm = '', faction = '', role = '') {
    if (!Array.isArray(charactersData)) return [];
    
    return charactersData.filter(character => {
        const matchesSearch = character.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFaction = !faction || character.faction.toLowerCase() === faction.toLowerCase();
        const matchesRole = !role || character.role.toLowerCase() === role.toLowerCase();
        return matchesSearch && matchesFaction && matchesRole;
    });
}

// Show character details in modal
function showCharacterDetails(characterName) {
    const character = charactersData.find(c => c.name === characterName);
    if (!character) return;
    
    const detailsContainer = createElement('div', { 
        class: 'character-details',
        id: `details-${sanitizeHTML(character.name)}`
    });
    
    const content = createElement('div', { class: 'row' });
    
    // Create image column
    const imgCol = createElement('div', { class: 'col-md-4' });
    const img = createElement('img', {
        src: sanitizeHTML(character.image),
        alt: sanitizeHTML(character.name),
        class: 'img-fluid'
    });
    imgCol.appendChild(img);
    
    // Create info column
    const infoCol = createElement('div', { class: 'col-md-8' });
    const name = createElement('h3', {}, character.name);
    const faction = createElement('span', { class: 'badge bg-primary' }, character.faction);
    
    infoCol.append(name, faction);
    content.append(imgCol, infoCol);
    detailsContainer.appendChild(content);
    
    // Insert details into DOM safely
    const characterCard = document.querySelector(`[data-character="${sanitizeHTML(characterName)}"]`);
    if (!characterCard) return;
    
    const existingDetails = document.querySelector('.character-details');
    if (existingDetails) {
        existingDetails.remove();
    }
    
    characterCard.closest('.row').after(detailsContainer);
}

// Initialize components with proper Bootstrap loading check
function initializeComponents() {
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap is not loaded');
        return;
    }

    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));

    // Add event listeners
    const emailForm = document.querySelector('#subscribeForm');
    emailForm?.addEventListener('submit', handleEmailSubmission);

    // Initialize modals safely
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        new bootstrap.Modal(modal, {
            keyboard: true,
            backdrop: true
        });
    });
}

// DOM ready handler
document.addEventListener('DOMContentLoaded', initializeComponents);

// Character page functionality
function initializeCharacterPage() {
    const factionFilter = document.getElementById('faction-filter');
    const roleFilter = document.getElementById('role-filter');
    const searchInput = document.getElementById('character-search');
    
    if (!factionFilter || !roleFilter || !searchInput) return;
    
    // Add event listeners for filters
    factionFilter.addEventListener('change', filterCharacters);
    roleFilter.addEventListener('change', filterCharacters);
    searchInput.addEventListener('input', filterCharacters);
    
    // Initial render
    renderCharacters(charactersData);

    // Add global modal cleanup
    document.addEventListener('hidden.bs.modal', function (event) {
        if (event.target.id === 'characterModal') {
            const modalBody = event.target.querySelector('.modal-body');
            if (modalBody) {
                modalBody.innerHTML = '';
            }
        }
    });
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

// Filter characters based on current filter values
function filterCharacters(searchTerm = '', faction = '', role = '') {
    if (!Array.isArray(charactersData)) return [];
    
    return charactersData.filter(character => {
        const matchesSearch = character.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFaction = !faction || character.faction.toLowerCase() === faction.toLowerCase();
        const matchesRole = !role || character.role.toLowerCase() === role.toLowerCase();
        return matchesSearch && matchesFaction && matchesRole;
    });
}

// Show character details in modal
function showCharacterDetails(characterName) {
    const character = charactersData.find(c => c.name === characterName);
    if (!character) return;
    
    const detailsContainer = createElement('div', { 
        class: 'character-details',
        id: `details-${sanitizeHTML(character.name)}`
    });
    
    const content = createElement('div', { class: 'row' });
    
    // Create image column
    const imgCol = createElement('div', { class: 'col-md-4' });
    const img = createElement('img', {
        src: sanitizeHTML(character.image),
        alt: sanitizeHTML(character.name),
        class: 'img-fluid'
    });
    imgCol.appendChild(img);
    
    // Create info column
    const infoCol = createElement('div', { class: 'col-md-8' });
    const name = createElement('h3', {}, character.name);
    const faction = createElement('span', { class: 'badge bg-primary' }, character.faction);
    
    infoCol.append(name, faction);
    content.append(imgCol, infoCol);
    detailsContainer.appendChild(content);
    
    // Insert details into DOM safely
    const characterCard = document.querySelector(`[data-character="${sanitizeHTML(characterName)}"]`);
    if (!characterCard) return;
    
    const existingDetails = document.querySelector('.character-details');
    if (existingDetails) {
        existingDetails.remove();
    }
    
    characterCard.closest('.row').after(detailsContainer);
}

// Initialize components with proper Bootstrap loading check
function initializeComponents() {
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap is not loaded');
        return;
    }

    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));

    // Add event listeners
    const emailForm = document.querySelector('#subscribeForm');
    emailForm?.addEventListener('submit', handleEmailSubmission);

    // Initialize modals safely
    const modals = document.querySelectorAll('.modal');
});
