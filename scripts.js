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
    
    sanitizeHTML(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
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
        alertDiv.role = 'alert';
        
        const sanitizedMessage = this.sanitizeHTML(message);
        alertDiv.innerHTML = `
            ${sanitizedMessage}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        alertContainer.appendChild(alertDiv);
        
        setTimeout(() => {
            if (alertDiv && alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, CONFIG.ALERT_DURATION);
    }
};

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
        
        // Process email submission
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

// Initialize components
function initializeComponents() {
    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));

    // Add event listeners
    const emailForm = document.querySelector('#subscribeForm');
    emailForm?.addEventListener('submit', handleEmailSubmission);

    // Initialize any existing modals
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

// Character data
const characters = [
    {
        name: "Arthas Menethil",
        faction: "alliance",
        role: "hero",
        laterRole: "villain",
        image: "images/characters/arthas.jpg",
        description: "Crown Prince of Lordaeron who later became the Lich King",
        details: "Once a noble paladin of the Silver Hand, Arthas' desire to save his people led him down a dark path."
    },
    {
        name: "Thrall",
        faction: "horde",
        role: "hero",
        image: "images/characters/thrall.jpg",
        description: "Warchief of the Horde",
        details: "A wise and powerful shaman who led the Horde to their new homeland in Kalimdor."
    }
    // Add more characters...
];

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
    renderCharacters(characters);

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
function renderCharacters(characterList) {
    const grid = document.getElementById('character-grid');
    grid.innerHTML = '';
    
    if (characterList.length === 0) {
        grid.innerHTML = `
            <div class="col-12 text-center">
                <p class="text-light">No characters found matching your criteria.</p>
            </div>
        `;
        return;
    }

    // Group characters into rows of 4
    for (let i = 0; i < characterList.length; i += 4) {
        const rowCharacters = characterList.slice(i, i + 4);
        const row = document.createElement('div');
        row.className = 'row g-4 mb-4';
        
        rowCharacters.forEach(character => {
            const characterCard = `
                <div class="col-md-3">
                    <div class="card h-100" data-character="${character.name}">
                        <img src="${character.image}" class="card-img-top" alt="${character.name}">
                        <div class="card-body">
                            <h5 class="card-title">${character.name}</h5>
                            <p class="card-text">${character.faction}</p>
                            <button class="btn btn-primary" onclick="showCharacterDetails('${character.name}')">
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            `;
            row.insertAdjacentHTML('beforeend', characterCard);
        });
        
        grid.appendChild(row);
    }
}

// Filter characters based on current filter values
function filterCharacters() {
    const faction = document.getElementById('faction-filter').value;
    const role = document.getElementById('role-filter').value;
    const search = document.getElementById('character-search').value.toLowerCase();
    
    const filtered = characters.filter(char => {
        const matchesFaction = !faction || char.faction === faction;
        const matchesRole = !role || char.role === role || char.laterRole === role;
        const matchesSearch = char.name.toLowerCase().includes(search);
        
        return matchesFaction && matchesRole && matchesSearch;
    });
    
    renderCharacters(filtered);
}

// Show character details in modal
function showCharacterDetails(characterName) {
    const character = characters.find(c => c.name === characterName);
    if (!character) return;
    
    // Check if detail section already exists
    const existingDetail = document.querySelector(`#detail-${characterName.replace(/\s+/g, '-')}`);
    if (existingDetail) {
        existingDetail.remove();
        return;
    }
    
    // Create detail section
    const detailHTML = `
        <div class="col-12 character-detail fade-in" id="detail-${characterName.replace(/\s+/g, '-')}">
            <div class="card">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4">
                            <img src="${character.image}" 
                                 class="img-fluid rounded" 
                                 alt="${character.name}"
                                 style="width: 100%; object-fit: cover;">
                        </div>
                        <div class="col-md-8">
                            <h3>${character.name}</h3>
                            <div class="d-flex flex-wrap gap-2 mb-3">
                                <span class="badge bg-primary">${character.faction}</span>
                                <span class="badge bg-secondary">${character.role}</span>
                                ${character.laterRole ? `<span class="badge bg-danger">${character.laterRole}</span>` : ''}
                            </div>
                            <p class="mt-3">${character.details}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Find the clicked character card
    const characterCard = document.querySelector(`[data-character="${characterName}"]`);
    const nextRow = characterCard.closest('.row').nextElementSibling;
    
    // Insert detail section after the current row
    if (nextRow) {
        nextRow.insertAdjacentHTML('beforebegin', detailHTML);
    } else {
        characterCard.closest('.row').insertAdjacentHTML('afterend', detailHTML);
    }
}

// Add to initialization
document.addEventListener('DOMContentLoaded', function() {
    initializeComponents();
    initializeCharacterPage();
});

// Campaign story content
const campaignContent = {
    reign: [
        // Exodus of the Horde
        {
            title: "Introduction: The Prophecy",
            content: `<div class="chapter-content">
                <h2>The Prophecy</h2>
                <p>The mysterious Prophet appears to Thrall in a dream, warning him of the impending doom and urging him to lead his people west across the sea to Kalimdor.</p>
            </div>`
        },
        {
            title: "Cinematic: Thrall's Vision",
            content: `<div class="chapter-content">
                <h2>Thrall's Vision</h2>
                <p>A cinematic sequence showing Thrall receiving the prophetic vision that sets the events of the game in motion.</p>
            </div>`
        },
        {
            title: "Chapter One: Chasing Visions",
            content: `<div class="chapter-content">
                <h2>Chasing Visions</h2>
                <p>Thrall begins to gather his forces and prepare for the long journey ahead, following the guidance of his prophetic dreams.</p>
            </div>`
        },
        {
            title: "Chapter Two: Departures",
            content: `<div class="chapter-content">
                <h2>Departures</h2>
                <p>The Horde begins their exodus, facing initial challenges as they prepare to leave their settled lands behind.</p>
            </div>`
        },
        {
            title: "Chapter Three: Riders on the Storm",
            content: `<div class="chapter-content">
                <h2>Riders on the Storm</h2>
                <p>The Horde faces their first major challenges at sea, battling against hostile elements and enemies.</p>
            </div>`
        },
        {
            title: "Chapter Four: The Fires Down Below",
            content: `<div class="chapter-content">
                <h2>The Fires Down Below</h2>
                <p>Thrall's forces encounter the Darkspear trolls and help them escape from their doomed island.</p>
            </div>`
        },
        {
            title: "Chapter Five: Countdown to Extinction",
            content: `<div class="chapter-content">
                <h2>Countdown to Extinction</h2>
                <p>The final battle on the islands as the Horde helps the trolls escape from the sea witch, gaining new allies in the process.</p>
            </div>`
        },
        // Human Campaign: The Scourge of Lordaeron
        {
            title: "Cinematic: The Warning",
            content: `<div class="chapter-content">
                <h2>The Warning</h2>
                <p>The Prophet attempts to warn King Terenas of the coming plague, but his warnings go unheeded.</p>
            </div>`
        },
        {
            title: "Chapter One: The Defense of Strahnbrad",
            content: `<div class="chapter-content">
                <h2>The Defense of Strahnbrad</h2>
                <p>Prince Arthas defends the town of Strahnbrad from bandits, showing his dedication to his people.</p>
            </div>`
        },
        {
            title: "Chapter Two: Blackrock and Roll",
            content: `<div class="chapter-content">
                <h2>Blackrock and Roll</h2>
                <p>Arthas confronts the Blackrock clan orcs who are threatening the borders of Lordaeron.</p>
            </div>`
        },
        {
            title: "Interlude: Jaina's Meeting",
            content: `<div class="chapter-content">
                <h2>Jaina's Meeting</h2>
                <p>Jaina Proudmoore meets with the mysterious Prophet, who warns her of the coming darkness.</p>
            </div>`
        },
        {
            title: "Chapter Three: Ravages of the Plague",
            content: `<div class="chapter-content">
                <h2>Ravages of the Plague</h2>
                <p>Arthas investigates the mysterious plague spreading through the northern villages of Lordaeron.</p>
            </div>`
        },
        {
            title: "Chapter Four: The Cult of the Damned",
            content: `<div class="chapter-content">
                <h2>The Cult of the Damned</h2>
                <p>The prince uncovers the sinister cult responsible for distributing the plagued grain.</p>
            </div>`
        },
        {
            title: "Chapter Five: March of the Scourge",
            content: `<div class="chapter-content">
                <h2>March of the Scourge</h2>
                <p>Arthas and Jaina race to stop Kel'Thuzad from spreading the plague throughout Andorhal.</p>
            </div>`
        },
        {
            title: "Interlude: The Prince and the Prophet",
            content: `<div class="chapter-content">
                <h2>The Prince and the Prophet</h2>
                <p>The Prophet attempts to convince Arthas of the danger, but the prince refuses to abandon his people.</p>
            </div>`
        },
        {
            title: "Chapter Six: The Culling",
            content: `<div class="chapter-content">
                <h2>The Culling</h2>
                <p>Arthas makes the devastating decision to purge Stratholme before its citizens can turn into the undead.</p>
            </div>`
        },
        {
            title: "Interlude: Divergent Courses",
            content: `<div class="chapter-content">
                <h2>Divergent Courses</h2>
                <p>Jaina chooses to follow the Prophet's guidance while Arthas continues his crusade against the undead.</p>
            </div>`
        },
        {
            title: "Chapter Seven: The Shores of Northrend",
            content: `<div class="chapter-content">
                <h2>The Shores of Northrend</h2>
                <p>Arthas pursues Mal'Ganis to the frozen continent of Northrend.</p>
            </div>`
        },
        {
            title: "Chapter Eight: Dissension",
            content: `<div class="chapter-content">
                <h2>Dissension</h2>
                <p>Facing recall orders from Lordaeron, Arthas takes drastic measures to continue his vendetta.</p>
            </div>`
        },
        {
            title: "Chapter Nine: Frostmourne",
            content: `<div class="chapter-content">
                <h2>Frostmourne</h2>
                <p>Arthas claims the cursed runeblade Frostmourne, sacrificing his soul for vengeance.</p>
            </div>`
        },
        {
            title: "Cinematic: Arthas' Betrayal",
            content: `<div class="chapter-content">
                <h2>Arthas' Betrayal</h2>
                <p>The tragic conclusion of Arthas' descent into darkness.</p>
            </div>`
        },
        // Undead Campaign: Path of the Damned
        {
            title: "Chapter One: Trudging through the Ashes",
            content: `<div class="chapter-content">
                <h2>Trudging through the Ashes</h2>
                <p>Death Knight Arthas begins his campaign to destroy Lordaeron from within.</p>
            </div>`
        },
        {
            title: "Chapter Two: Digging up the Dead",
            content: `<div class="chapter-content">
                <h2>Digging up the Dead</h2>
                <p>Arthas recovers the remains of Kel'Thuzad to resurrect him as a powerful lich.</p>
            </div>`
        },
        {
            title: "Interlude: The Dreadlords Convene",
            content: `<div class="chapter-content">
                <h2>The Dreadlords Convene</h2>
                <p>The demonic Dreadlords discuss their plans for the Scourge and Lordaeron.</p>
            </div>`
        },
        {
            title: "Chapter Three: Into the Realm Eternal",
            content: `<div class="chapter-content">
                <h2>Into the Realm Eternal</h2>
                <p>The Scourge begins their invasion of Quel'Thalas, home of the high elves.</p>
            </div>`
        },
        {
            title: "Chapter Four: Key of the Three Moons",
            content: `<div class="chapter-content">
                <h2>Key of the Three Moons</h2>
                <p>Arthas works to break through the elves' ancient defenses.</p>
            </div>`
        },
        {
            title: "Chapter Five: The Fall of Silvermoon",
            content: `<div class="chapter-content">
                <h2>The Fall of Silvermoon</h2>
                <p>The final assault on the high elven capital and the corruption of the Sunwell.</p>
            </div>`
        },
        {
            title: "Interlude: The Revelation",
            content: `<div class="chapter-content">
                <h2>The Revelation</h2>
                <p>The true purpose behind Kel'Thuzad's resurrection is revealed.</p>
            </div>`
        },
        {
            title: "Chapter Six: Blackrock & Roll, Too!",
            content: `<div class="chapter-content">
                <h2>Blackrock & Roll, Too!</h2>
                <p>The Scourge confronts the Blackrock clan to obtain a powerful artifact.</p>
            </div>`
        },
        {
            title: "Chapter Seven: The Siege of Dalaran",
            content: `<div class="chapter-content">
                <h2>The Siege of Dalaran</h2>
                <p>Arthas and his forces assault the magical city to obtain the Book of Medivh.</p>
            </div>`
        },
        {
            title: "Chapter Eight: Under the Burning Sky",
            content: `<div class="chapter-content">
                <h2>Under the Burning Sky</h2>
                <p>Kel'Thuzad begins the ritual to summon Archimonde into Azeroth.</p>
            </div>`
        },
        {
            title: "Cinematic: The Destruction of Dalaran",
            content: `<div class="chapter-content">
                <h2>The Destruction of Dalaran</h2>
                <p>Archimonde demonstrates his power by destroying Dalaran with a single spell.</p>
            </div>`
        },
        // Adding Orc Campaign: The Invasion of Kalimdor
        {
            title: "Chapter One: Landfall",
            content: `<div class="chapter-content">
                <h2>Landfall</h2>
                <p>The Horde finally reaches the shores of Kalimdor, but finds themselves separated and in hostile territory.</p>
            </div>`
        },
        {
            title: "Chapter Two: The Long March",
            content: `<div class="chapter-content">
                <h2>The Long March</h2>
                <p>Thrall begins searching for the rest of the Horde while establishing a foothold in this new land.</p>
            </div>`
        },
        {
            title: "Chapter Three: Cry of the Warsong",
            content: `<div class="chapter-content">
                <h2>Cry of the Warsong</h2>
                <p>The Warsong clan, led by Grom Hellscream, faces off against the night elves in Ashenvale Forest.</p>
            </div>`
        },
        {
            title: "Interlude: The Blood Pact",
            content: `<div class="chapter-content">
                <h2>The Blood Pact</h2>
                <p>Grom makes a terrible choice to drink demon blood, leading his clan back into corruption.</p>
            </div>`
        },
        {
            title: "Chapter Four: The Oracle",
            content: `<div class="chapter-content">
                <h2>The Oracle</h2>
                <p>Thrall meets with the mysterious Oracle, revealed to be the Prophet, and learns of his people's destiny.</p>
            </div>`
        },
        {
            title: "Chapter Five: By Demons Be Driven",
            content: `<div class="chapter-content">
                <h2>By Demons Be Driven</h2>
                <p>Thrall and Cairne work together to save Grom from demonic corruption.</p>
            </div>`
        },
        {
            title: "Chapter Six: The Hunter of Shadows",
            content: `<div class="chapter-content">
                <h2>The Hunter of Shadows</h2>
                <p>Thrall and Grom confront Mannoroth, the demon whose blood cursed the orcs.</p>
            </div>`
        },
        {
            title: "Cinematic: Hellscream's Redemption",
            content: `<div class="chapter-content">
                <h2>Hellscream's Redemption</h2>
                <p>Grom sacrifices himself to kill Mannoroth and free the orcs from their blood curse.</p>
            </div>`
        },
        // Night Elf Campaign: Eternity's End
        {
            title: "Chapter One: Enemies at the Gate",
            content: `<div class="chapter-content">
                <h2>Enemies at the Gate</h2>
                <p>Tyrande Whisperwind awakens the druids to defend against the invasion of their lands.</p>
            </div>`
        },
        {
            title: "Chapter Two: Daughters of the Moon",
            content: `<div class="chapter-content">
                <h2>Daughters of the Moon</h2>
                <p>Tyrande leads her Sentinels against the invading forces while searching for additional allies.</p>
            </div>`
        },
        {
            title: "Chapter Three: The Awakening of Stormrage",
            content: `<div class="chapter-content">
                <h2>The Awakening of Stormrage</h2>
                <p>Tyrande awakens Malfurion Stormrage from his druidic slumber.</p>
            </div>`
        },
        {
            title: "Chapter Four: The Druids Arise",
            content: `<div class="chapter-content">
                <h2>The Druids Arise</h2>
                <p>Malfurion works to awaken the remaining druids while dealing with the corruption in their lands.</p>
            </div>`
        },
        {
            title: "Interlude: A Destiny of Flame and Sorrow",
            content: `<div class="chapter-content">
                <h2>A Destiny of Flame and Sorrow</h2>
                <p>Tyrande makes the controversial decision to free Illidan from his prison.</p>
            </div>`
        },
        {
            title: "Chapter Five: Brothers in Blood",
            content: `<div class="chapter-content">
                <h2>Brothers in Blood</h2>
                <p>Illidan proves his worth by defeating a powerful dreadlord, but his methods concern his brother.</p>
            </div>`
        },
        {
            title: "Chapter Six: A Destiny of Flame and Sorrow",
            content: `<div class="chapter-content">
                <h2>A Destiny of Flame and Sorrow</h2>
                <p>Illidan consumes the Skull of Gul'dan, becoming a demon himself in the process.</p>
            </div>`
        },
        {
            title: "Chapter Seven: The Last Guardian",
            content: `<div class="chapter-content">
                <h2>The Last Guardian</h2>
                <p>The night elves forge an alliance with the humans and orcs to defend Mount Hyjal.</p>
            </div>`
        },
        {
            title: "Final Chapter: Twilight of the Gods",
            content: `<div class="chapter-content">
                <h2>Twilight of the Gods</h2>
                <p>The combined forces of the mortal races make their final stand against Archimonde at Mount Hyjal.</p>
            </div>`
        },
        {
            title: "Cinematic: Eternity's End",
            content: `<div class="chapter-content">
                <h2>Eternity's End</h2>
                <p>The World Tree is sacrificed to destroy Archimonde and save Azeroth, marking the end of the Third War.</p>
            </div>`
        }
    ],
    frozen: [
        // Sentinel Campaign: Terror of the Tides
        {
            title: "Chapter 1: Rise of the Naga",
            content: `<div class="chapter-content">
                <h2>Rise of the Naga</h2>
                <p>Maiev Shadowsong pursues Illidan across the Great Sea, following his trail to the Broken Isles.</p>
            </div>`
        },
        {
            title: "Chapter 2: The Broken Isles",
            content: `<div class="chapter-content">
                <h2>The Broken Isles</h2>
                <p>Maiev and her Watchers explore the ancient ruins of Suramar, searching for signs of Illidan.</p>
            </div>`
        },
        {
            title: "Chapter 3: The Tomb of Sargeras",
            content: `<div class="chapter-content">
                <h2>The Tomb of Sargeras</h2>
                <p>Maiev follows Illidan into the Tomb of Sargeras, where he seeks a powerful artifact.</p>
            </div>`
        },
        {
            title: "Chapter 4: The Search for Illidan",
            content: `<div class="chapter-content">
                <h2>The Search for Illidan</h2>
                <p>After Illidan's escape, Maiev seeks help from Malfurion and Tyrande to track him down.</p>
            </div>`
        },
        // Alliance Campaign: Curse of the Blood Elves
        {
            title: "Chapter 1: Misconceptions",
            content: `<div class="chapter-content">
                <h2>Misconceptions</h2>
                <p>Prince Kael'thas and his Blood Elves face discrimination while serving under the Alliance command in Lordaeron.</p>
            </div>`
        },
        {
            title: "Chapter 2: A Dark Covenant",
            content: `<div class="chapter-content">
                <h2>A Dark Covenant</h2>
                <p>Kael'thas forms an alliance with Lady Vashj and her Naga to survive the hostile wilderness.</p>
            </div>`
        },
        {
            title: "Chapter 3: The Dungeons of Dalaran",
            content: `<div class="chapter-content">
                <h2>The Dungeons of Dalaran</h2>
                <p>Kael'thas and his forces must escape from the dungeons of Dalaran after being imprisoned for consorting with the Naga.</p>
            </div>`
        },
        {
            title: "Chapter 4: The Crossing",
            content: `<div class="chapter-content">
                <h2>The Crossing</h2>
                <p>The Blood Elves and Naga make their way through the portal to Outland to find Illidan.</p>
            </div>`
        },
        // Scourge Campaign: Legacy of the Damned
        {
            title: "Chapter 1: King Arthas",
            content: `<div class="chapter-content">
                <h2>King Arthas</h2>
                <p>Arthas returns to Lordaeron to claim his throne, but finds his kingdom in chaos.</p>
            </div>`
        },
        {
            title: "Chapter 2: The Flight from Lordaeron",
            content: `<div class="chapter-content">
                <h2>The Flight from Lordaeron</h2>
                <p>Sylvanas and the Dreadlords stage a coup against Arthas, forcing him to flee.</p>
            </div>`
        },
        {
            title: "Chapter 3: The Dark Lady",
            content: `<div class="chapter-content">
                <h2>The Dark Lady</h2>
                <p>Sylvanas establishes her dominion over the ruins of Lordaeron, creating the Forsaken.</p>
            </div>`
        },
        {
            title: "Chapter 4: The Return to Northrend",
            content: `<div class="chapter-content">
                <h2>The Return to Northrend</h2>
                <p>Arthas races to save the Lich King as his powers begin to fade.</p>
            </div>`
        },
        // Bonus Campaign: The Founding of Durotar
        {
            title: "Chapter 1: To Tame a Land",
            content: `<div class="chapter-content">
                <h2>To Tame a Land</h2>
                <p>Rexxar helps the Horde establish their new homeland in Durotar.</p>
            </div>`
        },
        {
            title: "Chapter 2: Old Hatreds",
            content: `<div class="chapter-content">
                <h2>Old Hatreds</h2>
                <p>Rexxar investigates attacks on Orcish settlements and uncovers a human conspiracy.</p>
            </div>`
        },
        {
            title: "Chapter 3: A Blaze of Glory",
            content: `<div class="chapter-content">
                <h2>A Blaze of Glory</h2>
                <p>Rexxar leads the Horde's forces against Admiral Proudmoore's invasion.</p>
            </div>`
        },
        // Final Confrontation
        {
            title: "Final Chapter: A Symphony of Frost and Flame",
            content: `<div class="chapter-content">
                <h2>A Symphony of Frost and Flame</h2>
                <p>The final confrontation between Arthas and Illidan takes place outside the Frozen Throne. Arthas emerges victorious and ascends to merge with the Lich King, while Illidan is left for dead in the snow.</p>
            </div>`
        }
    ]
};

// Story navigation state
let currentCampaign = 'reign';
let currentChapter = 0;

// Initialize story functionality
document.addEventListener('DOMContentLoaded', function() {
    // Campaign button listeners
    const campaignButtons = document.querySelectorAll('[data-campaign]');
    campaignButtons.forEach(button => {
        button.addEventListener('click', () => switchCampaign(button.dataset.campaign));
    });

    // Chapter navigation listeners
    document.getElementById('prev-chapter').addEventListener('click', previousChapter);
    document.getElementById('next-chapter').addEventListener('click', nextChapter);

    // Initialize first campaign
    updateContent();
});

// Switch between campaigns
function switchCampaign(campaign) {
    currentCampaign = campaign;
    currentChapter = 0;
    updateContent();
    
    // Update button states
    document.querySelectorAll('[data-campaign]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.campaign === campaign);
    });
    
    // Show/hide campaign content
    document.getElementById('reign-content').classList.toggle('d-none', campaign !== 'reign');
    document.getElementById('frozen-content').classList.toggle('d-none', campaign !== 'frozen');
}

// Navigate to previous chapter
function previousChapter() {
    if (currentChapter > 0) {
        currentChapter--;
        updateContent();
    }
}

// Navigate to next chapter
function nextChapter() {
    if (currentChapter < campaignContent[currentCampaign].length - 1) {
        currentChapter++;
        updateContent();
    }
}

// Update content and navigation states
function updateContent() {
    // Update chapter content
    const content = campaignContent[currentCampaign][currentChapter];
    document.getElementById(`${currentCampaign}-content`).innerHTML = content.content;

    // Update navigation buttons
    const prevButton = document.getElementById('prev-chapter').parentElement;
    const nextButton = document.getElementById('next-chapter').parentElement;
    
    prevButton.classList.toggle('disabled', currentChapter === 0);
    nextButton.classList.toggle('disabled', currentChapter === campaignContent[currentCampaign].length - 1);
}

// Add event listeners when the document loads
document.addEventListener('DOMContentLoaded', function() {
    // Search functionality
    const searchInput = document.getElementById('character-search');
    searchInput.addEventListener('input', handleSearch);

    // Filter functionality
    const factionFilter = document.getElementById('faction-filter');
    const roleFilter = document.getElementById('role-filter');
    
    factionFilter.addEventListener('change', applyFilters);
    roleFilter.addEventListener('change', applyFilters);
});

function handleSearch() {
    applyFilters();
}

function applyFilters() {
    const searchTerm = document.getElementById('character-search').value.toLowerCase();
    const selectedFaction = document.getElementById('faction-filter').value.toLowerCase();
    const selectedRole = document.getElementById('role-filter').value.toLowerCase();

    const filteredCharacters = characters.filter(character => {
        const matchesSearch = character.name.toLowerCase().includes(searchTerm) ||
                            character.faction.toLowerCase().includes(searchTerm) ||
                            character.details.toLowerCase().includes(searchTerm);
        
        const matchesFaction = !selectedFaction || character.faction.toLowerCase() === selectedFaction;
        const matchesRole = !selectedRole || character.role.toLowerCase() === selectedRole;

        return matchesSearch && matchesFaction && matchesRole;
    });

    renderCharacters(filteredCharacters);
}

// Voice test data
const voiceTests = [
    {
        soundFile: 'sounds/arthas_angry.mp3',
        character: 'Arthas',
        options: ['Arthas', 'Medivh', 'Kel\'Thuzad', 'Jaina'],
        quote: "Voice of Prince Arthas"
    },
    {
        soundFile: 'sounds/jaina.mp3',
        character: 'Jaina',
        options: ['Jaina', 'Huntress', 'Tyrande', 'Maiev'],
        quote: "Voice of Jaina Proudmoore"
    },
    {
        soundFile: 'sounds/trall.mp3',
        character: 'Thrall',
        options: ['Thrall', 'Farseer', 'Medivh', 'Arthas'],
        quote: "Voice of Thrall"
    },
    {
        soundFile: 'sounds/mediv.mp3',
        character: 'Medivh',
        options: ['Medivh', 'Kel\'Thuzad', 'Arthas', 'Anub\'arak'],
        quote: "Voice of Medivh"
    },
    {
        soundFile: 'sounds/tuzad.mp3',
        character: 'Kel\'Thuzad',
        options: ['Kel\'Thuzad', 'Medivh', 'Anub\'arak', 'Necromancer'],
        quote: "Voice of Kel\'Thuzad"
    },
    {
        soundFile: 'sounds/anubarak.mp3',
        character: 'Anub\'arak',
        options: ['Anub\'arak', 'Kel\'Thuzad', 'Arthas', 'Necromancer'],
        quote: "Voice of Anub\'arak"
    },
    {
        soundFile: 'sounds/tirend.mp3',
        character: 'Tyrande',
        options: ['Tyrande', 'Huntress', 'Jaina', 'Maiev'],
        quote: "Voice of Tyrande Whisperwind"
    },
    {
        soundFile: 'sounds/farseer.mp3',
        character: 'Farseer',
        options: ['Farseer', 'Thrall', 'Shaman', 'Medivh'],
        quote: "Voice of the Farseer"
    },
    {
        soundFile: 'sounds/shaman.mp3',
        character: 'Shaman',
        options: ['Shaman', 'Farseer', 'Thrall', 'Healer'],
        quote: "Voice of the Shaman"
    },
    {
        soundFile: 'sounds/huntress.mp3',
        character: 'Huntress',
        options: ['Huntress', 'Archer', 'Tyrande', 'Maiev'],
        quote: "Voice of the Huntress"
    }
];

let currentTest = 0;
let score = 0;

// Initialize voice test
function initializeVoiceTest() {
    const voiceTestContainer = document.getElementById('voiceTest');
    if (!voiceTestContainer) return;

    const playButton = document.getElementById('playSound');
    const audioElement = document.getElementById('voiceClip');
    const scoreElement = document.getElementById('score');
    const questionElement = document.getElementById('questionNumber');

    // Preload all audio files
    voiceTests.forEach(test => {
        const audio = new Audio(test.soundFile);
        audio.preload = 'auto';
    });

    loadQuestion(currentTest);

    playButton.addEventListener('click', () => {
        audioElement.play();
    });
}

function loadQuestion(index) {
    if (index >= voiceTests.length) {
        showFinalScore();
        return;
    }

    const test = voiceTests[index];
    const audioElement = document.getElementById('voiceClip');
    const playButton = document.getElementById('playSound');
    const optionsContainer = document.getElementById('answerOptions');
    const questionElement = document.getElementById('questionNumber');
    const feedbackElement = document.getElementById('feedback');

    // Disable play button while loading
    playButton.disabled = true;
    playButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Loading...';

    // Update audio source
    audioElement.src = test.soundFile;
    
    // Enable play button when audio is ready
    audioElement.addEventListener('canplaythrough', () => {
        playButton.disabled = false;
        playButton.innerHTML = '<i class="fas fa-play me-2"></i>Play Voice';
    }, { once: true });

    // Handle audio loading error
    audioElement.addEventListener('error', () => {
        playButton.disabled = true;
        playButton.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i>Error Loading Audio';
    }, { once: true });

    // Clear previous feedback
    feedbackElement.style.display = 'none';

    // Update question number
    questionElement.textContent = index + 1;

    // Generate answer options
    optionsContainer.innerHTML = test.options
        .map(option => `
            <div class="col-md-6">
                <button class="btn btn-outline-primary w-100 answer-option" 
                        onclick="checkAnswer('${option}')">
                    ${option}
                </button>
            </div>
        `).join('');
}

function checkAnswer(selectedAnswer) {
    const test = voiceTests[currentTest];
    const feedbackElement = document.getElementById('feedback');
    const scoreElement = document.getElementById('score');

    if (selectedAnswer === test.character) {
        score++;
        feedbackElement.className = 'alert alert-success mt-3';
        feedbackElement.textContent = `Correct! This was ${test.character} saying "${test.quote}"`;
    } else {
        feedbackElement.className = 'alert alert-danger mt-3';
        feedbackElement.textContent = `Wrong! This was ${test.character} saying "${test.quote}"`;
    }

    feedbackElement.style.display = 'block';
    scoreElement.textContent = score;

    // Move to next question after delay
    setTimeout(() => {
        currentTest++;
        loadQuestion(currentTest);
    }, 2000);
}

function showFinalScore() {
    const voiceTest = document.getElementById('voiceTest');
    voiceTest.innerHTML = `
        <div class="text-center">
            <h2>Test Complete!</h2>
            <p class="h3 mb-4">Final Score: ${score}/${voiceTests.length}</p>
            <button class="btn btn-primary" onclick="restartTest()">Try Again</button>
        </div>
    `;
}

function restartTest() {
    currentTest = 0;
    score = 0;
    document.getElementById('score').textContent = '0';
    loadQuestion(0);
}

// Add to your existing DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    initializeVoiceTest();
});
