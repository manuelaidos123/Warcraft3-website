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
const charactersData = [
    {
        id: 1,
        name: "Arthas Menethil",
        faction: "alliance",
        role: "hero",
        image: "images/characters/Arthas.jpg",
        description: "Crown Prince of Lordaeron and Knight of the Silver Hand.",
        class: "Paladin"
    },
    {
        id: 2,
        name: "Jaina Proudmoore",
        faction: "alliance",
        role: "hero",
        image: "images/characters/jaina.jpg",
        description: "Archmage of the Kirin Tor and ruler of Theramore.",
        class: "Archmage"
    },
    {
        id: 3,
        name: "Muradin Bronzebeard",
        faction: "alliance",
        role: "hero",
        image: "images/characters/Arthas.jpg", // Muradin image missing, using Arthas as placeholder
        description: "Mountain King and brother to King Magni Bronzebeard.",
        class: "Mountain King"
    },
    {
        id: 4,
        name: "Thrall",
        faction: "horde",
        role: "hero",
        image: "images/characters/Thrall.jpg",
        description: "Warchief of the Horde and powerful Shaman.",
        class: "Far Seer"
    },
    {
        id: 5,
        name: "Grom Hellscream",
        faction: "horde",
        role: "hero",
        image: "images/characters/grom.jpg",
        description: "Chieftain of the Warsong Clan.",
        class: "Blademaster"
    },
    {
        id: 6,
        name: "Cairne Bloodhoof",
        faction: "horde",
        role: "hero",
        image: "images/characters/cairne.jpg",
        description: "High Chieftain of the Tauren tribes.",
        class: "Tauren Chieftain"
    },
    {
        id: 7,
        name: "Arthas (Death Knight)",
        faction: "undead",
        role: "villain",
        image: "images/characters/Arthas.jpg",
        description: "Champion of the Lich King and leader of the Scourge.",
        class: "Death Knight"
    },
    {
        id: 8,
        name: "Kel'Thuzad",
        faction: "undead",
        role: "villain",
        image: "images/characters/kelthuzad.jpg",
        description: "Founder of the Cult of the Damned and Archlich.",
        class: "Lich"
    },
    {
        id: 9,
        name: "Tyrande Whisperwind",
        faction: "nightelf",
        role: "hero",
        image: "images/characters/tyrande.jpg",
        description: "High Priestess of Elune and leader of the Sentinels.",
        class: "Priestess of the Moon"
    },
    {
        id: 10,
        name: "Malfurion Stormrage",
        faction: "nightelf",
        role: "hero",
        image: "images/characters/malfurion.jpg",
        description: "First Druid and Shan'do of the Night Elves.",
        class: "Keeper of the Grove"
    },
    {
        id: 11,
        name: "Illidan Stormrage",
        faction: "nightelf",
        role: "villain",
        image: "images/characters/illidan.jpg",
        description: "The Betrayer, twin brother of Malfurion.",
        class: "Demon Hunter"
    },
    {
        id: 12,
        name: "Sylvanas Windrunner",
        faction: "undead",
        role: "villain",
        image: "images/characters/sylvanas.jpg",
        description: "Former Ranger-General, now Banshee Queen.",
        class: "Dark Ranger"
    }
];

// Render characters to grid
function renderCharacters(charactersList) {
    console.log("renderCharacters called with", charactersList.length, "characters");
    const container = document.getElementById('character-grid');
    if (!container) {
        return;
    }

    container.innerHTML = ''; // Clear existing content

    if (charactersList.length === 0) {
        console.log("No characters to display");
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <p class="lead text-muted">No characters found matching your criteria.</p>
            </div>
        `;
        return;
    }

    charactersList.forEach(character => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 fade-in';

        // Determine badge color based on faction
        let badgeClass = 'bg-secondary';
        if (character.faction === 'alliance') badgeClass = 'bg-primary';
        else if (character.faction === 'horde') badgeClass = 'bg-danger';
        else if (character.faction === 'undead') badgeClass = 'bg-dark';
        else if (character.faction === 'nightelf') badgeClass = 'bg-success';

        col.innerHTML = `
            <div class="card h-100 shadow-sm hover-card">
                <div class="position-relative">
                    <img src="${character.image}" class="card-img-top" alt="${character.name}" 
                         style="height: 250px; object-fit: cover;"
                         onerror="this.src='images/characters/placeholder.jpg'">
                    <span class="position-absolute top-0 end-0 badge ${badgeClass} m-2">
                        ${character.faction.charAt(0).toUpperCase() + character.faction.slice(1)}
                    </span>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${character.name}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">${character.class}</h6>
                    <p class="card-text">${character.description}</p>
                </div>
                <div class="card-footer bg-transparent border-top-0">
                    <span class="badge bg-secondary">${character.role.toUpperCase()}</span>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
}

// Filter characters
function filterCharacters() {
    console.log("Filtering characters...");
    const factionFilter = document.getElementById('faction-filter')?.value;
    const roleFilter = document.getElementById('role-filter')?.value;
    const searchQuery = document.getElementById('character-search')?.value.toLowerCase();

    const filtered = charactersData.filter(char => {
        const matchesFaction = !factionFilter || char.faction === factionFilter;
        const matchesRole = !roleFilter || char.role === roleFilter;
        const matchesSearch = !searchQuery ||
            char.name.toLowerCase().includes(searchQuery) ||
            char.description.toLowerCase().includes(searchQuery) ||
            char.class.toLowerCase().includes(searchQuery);

        return matchesFaction && matchesRole && matchesSearch;
    });

    renderCharacters(filtered);
}

// Initialize Character Gallery
function initCharacterGallery() {
    console.log("Initializing Character Gallery...");
    const grid = document.getElementById('character-grid');
    if (!grid) {
        return;
    }

    // Initial render
    renderCharacters(charactersData);

    // Event listeners
    document.getElementById('faction-filter')?.addEventListener('change', filterCharacters);
    document.getElementById('role-filter')?.addEventListener('change', filterCharacters);
    document.getElementById('character-search')?.addEventListener('input', filterCharacters);
}

// Campaign Data
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

// Story State
const storyState = {
    currentCampaign: 'reign',
    currentChapter: 1
};

// Navigation Functions
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

function navigatePreviousChapter() {
    const campaign = campaigns[storyState.currentCampaign];
    if (storyState.currentChapter > 1) {
        storyState.currentChapter--;
        updateDisplay();
        loadChapterContent();
    }
}

function navigateNextChapter() {
    const campaign = campaigns[storyState.currentCampaign];
    if (storyState.currentChapter < campaign.chapters) {
        storyState.currentChapter++;
        updateDisplay();
        loadChapterContent();
    }
}

// Initialize everything on DOM Content Loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log("DOM Content Loaded");

    try {
        initializeStoryNavigation();
    } catch (e) {
        console.error("Error initializing story navigation:", e);
    }

    try {
        console.log("Calling initCharacterGallery...");
        initCharacterGallery();
    } catch (e) {
        console.error("Error initializing character gallery:", e);
        const grid = document.getElementById('character-grid');
        if (grid) {
            grid.innerHTML = `<div class="alert alert-danger">Error loading gallery: ${e.message}</div>`;
        }
    }

    // Check for URL parameters to switch campaign
    const urlParams = new URLSearchParams(window.location.search);
    const campaignParam = urlParams.get('campaign');

    if (campaignParam && campaigns[campaignParam]) {
        switchCampaign(campaignParam);
    } else {
        // Default to Reign of Chaos if on story page
        if (window.location.pathname.includes('story.html')) {
            document.querySelector('[data-campaign="reign"]')?.click();
        }
    }
});
