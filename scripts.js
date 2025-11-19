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

// Remove ALL duplicate code and consolidate to single implementation
document.addEventListener('DOMContentLoaded', function() {
    // Single campaign data store
    const campaigns = {
        reign: {
            chapters: 8,
            currentChapter: 1,
            content: [
                {
                    title: "Human Campaign: The Scourge of Lordaeron",
                    text: "Follow Prince Arthas as he defends his kingdom from a mysterious plague, leading to choices that will change his destiny forever."
                },
                {
                    title: "Undead Campaign: Path of the Damned",
                    text: "Witness Arthas's transformation as he leads the undead Scourge against his own kingdom."
                },
                {
                    title: "Orc Campaign: The Invasion of Kalimdor",
                    text: "Join Thrall and the Horde as they sail to the ancient lands of Kalimdor, facing new allies and enemies."
                },
                {
                    title: "Night Elf Campaign: Eternity's End",
                    text: "Defend the ancient forests with the Night Elves as they face their greatest challenge yet."
                },
                {
                    title: "Chapter 5: The Battle for Mount Hyjal",
                    text: "The forces of good unite to face the Burning Legion in an epic battle that will determine the fate of Azeroth."
                },
                {
                    title: "Chapter 6: The Aftermath",
                    text: "In the wake of the great battle, new alliances are formed and old enemies resurface."
                },
                {
                    title: "Chapter 7: Rising Tensions",
                    text: "As the world recovers, tensions between factions begin to escalate once more."
                },
                {
                    title: "Chapter 8: The New Order",
                    text: "The world of Azeroth is forever changed, setting the stage for conflicts yet to come."
                }
            ]
        },
        frozen: {
            chapters: 6,
            currentChapter: 1,
            content: [
                {
                    title: "Night Elf Campaign: Terror of the Tides",
                    text: "Join Maiev Shadowsong in her relentless pursuit of the betrayer, Illidan Stormrage."
                },
                {
                    title: "Alliance Campaign: Curse of the Blood Elves",
                    text: "Follow Prince Kael'thas as he leads his people in their desperate search for a cure to their magic addiction."
                },
                {
                    title: "Scourge Campaign: Legacy of the Damned",
                    text: "Command Arthas and Sylvanas in their struggle for control of the Undead Scourge."
                },
                {
                    title: "Chapter 4: The Frozen Throne",
                    text: "Arthas faces his ultimate test as he approaches the Frozen Throne to claim his destiny."
                },
                {
                    title: "Chapter 5: The Lich King Awakens",
                    text: "The merging of Arthas and Ner'zhul creates the ultimate evil, the Lich King."
                },
                {
                    title: "Chapter 6: A New Era",
                    text: "With the Lich King's awakening, a new era of darkness begins across Azeroth."
                }
            ]
        }
    };

    // Single state management
    const storyState = {
        currentCampaign: 'reign',
        currentChapter: 1
    };

    // Single set of event handlers
    function initializeStoryNavigation() {
        // Campaign buttons
        document.querySelectorAll('[data-campaign]').forEach(button => {
            button.addEventListener('click', () => switchCampaign(button.dataset.campaign));
        });

        // Navigation buttons
        document.getElementById('prev-chapter')?.addEventListener('click', navigatePreviousChapter);
        document.getElementById('next-chapter')?.addEventListener('click', navigateNextChapter);

        // Chapter items
        document.querySelectorAll('.chapter-item').forEach(item => {
            item.addEventListener('click', () => {
                const chapterNumber = parseInt(item.dataset.chapter);
                storyState.currentChapter = chapterNumber;
                updateDisplay();
                loadChapterContent();
            });
        });
    }

    // Single campaign switching function
    function switchCampaign(campaignId) {
        if (!campaigns[campaignId]) return;
        
        storyState.currentCampaign = campaignId;
        storyState.currentChapter = 1;
        
        // Update UI
        document.querySelectorAll('[data-campaign]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.campaign === campaignId);
        });
        
        // Show/hide content
        document.querySelectorAll('.campaign-content').forEach(content => {
            content.classList.toggle('d-none', !content.id.includes(campaignId));
        });
        
        updateDisplay();
        loadChapterContent();
    }

    // Single chapter loading function
    function loadChapterContent() {
        const campaign = campaigns[storyState.currentCampaign];
        const content = campaign.content[storyState.currentChapter - 1];
        
        const targetContent = document.getElementById(`${storyState.currentCampaign}-content`);
        if (!targetContent || !content) return;

        // Show loading spinner
        const spinner = targetContent.querySelector('.loading-spinner');
        if (spinner) spinner.classList.remove('d-none');

        setTimeout(() => {
            if (spinner) spinner.classList.add('d-none');

            // Look for a .chapter-dynamic-content, or create it
            let dynamicContent = targetContent.querySelector('.chapter-dynamic-content');
            if (!dynamicContent) {
                dynamicContent = document.createElement('div');
                dynamicContent.className = 'chapter-dynamic-content';
                // Insert after spinner and before campaign-overview, or as last child
                if (spinner && spinner.nextSibling) {
                    targetContent.insertBefore(dynamicContent, spinner.nextSibling);
                } else {
                    targetContent.appendChild(dynamicContent);
                }
            }
            dynamicContent.innerHTML = `
                <h2>${content.title}</h2>
                <p>${content.text}</p>
            `;
        }, 300);
    }

    // Single display update function
    function updateDisplay() {
        // Update progress bar
        const campaign = campaigns[storyState.currentCampaign];
        const progress = (storyState.currentChapter / campaign.chapters) * 100;
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
            progressBar.setAttribute('aria-valuenow', progress);
        }

        // Update navigation buttons
        const prevBtn = document.getElementById('prev-chapter');
        const nextBtn = document.getElementById('next-chapter');
        
        if (prevBtn) {
            prevBtn.parentElement.classList.toggle('disabled', storyState.currentChapter === 1);
        }
        if (nextBtn) {
            nextBtn.parentElement.classList.toggle('disabled', storyState.currentChapter === campaign.chapters);
        }

        // Update active chapter items
        document.querySelectorAll('.chapter-item').forEach(item => {
            item.classList.toggle('active', parseInt(item.dataset.chapter) === storyState.currentChapter);
        });
    }

    // Previous chapter navigation
    function navigatePreviousChapter() {
        const campaign = campaigns[storyState.currentCampaign];
        if (storyState.currentChapter > 1) {
            storyState.currentChapter--;
            updateDisplay();
            loadChapterContent();
        }
    }

    // Next chapter navigation
    function navigateNextChapter() {
        const campaign = campaigns[storyState.currentCampaign];
        if (storyState.currentChapter < campaign.chapters) {
            storyState.currentChapter++;
            updateDisplay();
            loadChapterContent();
        }
    }

    // Initialize everything
    initializeStoryNavigation();
    document.querySelector('[data-campaign="reign"]')?.click();
});
