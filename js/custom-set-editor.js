// Custom set editor — create, edit, delete custom sets

let _editorSelectedCards = {};  // { cardNumber: cardData }
let _editorSetKey = null;       // null = new, string = editing existing
let _editorCardCounter = 1;

// Open the custom set editor modal
function openCustomSetEditor(setKey) {
    _editorSetKey = setKey;
    _editorSelectedCards = {};
    _editorCardCounter = 1;

    // If editing, pre-populate selected cards
    let existingData = null;
    if (setKey && customCardSets[setKey]) {
        existingData = customCardSets[setKey];
        existingData.cards.forEach(card => {
            _editorSelectedCards[card.number] = { ...card };
        });
        _editorCardCounter = Math.max(...existingData.cards.map(c => c.number), 0) + 1;
    }

    const modal = document.createElement('div');
    modal.id = 'customSetEditorModal';
    modal.className = 'cse-modal';

    modal.innerHTML = `
        <div class="cse-modal-content">
            <div class="cse-modal-header">
                <h2>${setKey ? 'Edit Custom Set' : 'Create Custom Set'}</h2>
                <button class="cse-close" onclick="closeCustomSetEditor()">&times;</button>
            </div>
            <div class="cse-modal-body">
                <div class="cse-step cse-step-meta active" id="cseStepMeta">
                    <div class="cse-form-group">
                        <label for="cseSetName">Set Name</label>
                        <input type="text" id="cseSetName" class="cse-input" placeholder="e.g. My Favorites" value="${existingData ? existingData.displayName : ''}" maxlength="60">
                    </div>
                    <div class="cse-form-row">
                        <div class="cse-form-group">
                            <label for="cseThemeColor">Theme Color</label>
                            <input type="color" id="cseThemeColor" class="cse-color-input" value="${existingData ? (existingData.themeColor || '#ff9500') : '#ff9500'}">
                        </div>
                        <div class="cse-form-group">
                            <label for="cseSetDate">Set Date (optional)</label>
                            <input type="date" id="cseSetDate" class="cse-input" value="${existingData ? (existingData.setDate || '') : ''}">
                        </div>
                    </div>
                    <div class="cse-form-group">
                        <label for="cseLogoUrl">Logo Image URL (optional)</label>
                        <div class="cse-logo-input-row">
                            <input type="text" id="cseLogoUrl" class="cse-input" placeholder="https://..." value="${existingData ? (existingData.logoUrl || '') : ''}" oninput="cseUpdateLogoPreview(this.value)">
                            <div class="cse-logo-preview" id="cseLogoPreview">${existingData && existingData.logoUrl ? `<img src="${existingData.logoUrl}" alt="Logo preview" onerror="this.parentElement.innerHTML='No preview'">` : ''}</div>
                        </div>
                    </div>
                    <div class="cse-form-group">
                        <label for="cseDescription">Description (optional)</label>
                        <textarea id="cseDescription" class="cse-input cse-textarea" placeholder="What makes this set special?" maxlength="200">${existingData ? (existingData.description || '') : ''}</textarea>
                    </div>
                    <button class="cse-btn primary" onclick="cseGoToCardPicker()">Next: Add Cards</button>
                </div>
                <div class="cse-step cse-step-cards" id="cseStepCards">
                    <div class="cse-card-picker-header">
                        <button class="cse-btn secondary" onclick="cseGoToMeta()">Back</button>
                        <span class="cse-selected-count" id="cseSelectedCount">${Object.keys(_editorSelectedCards).length} cards selected</span>
                    </div>
                    <div class="cse-set-selector">
                        <select id="cseSetSelect" class="cse-input" onchange="cseLoadOfficialSet(this.value)">
                            <option value="">-- Choose an official set --</option>
                        </select>
                        <div class="cse-picker-search">
                            <input type="text" id="cseCardSearch" class="cse-input" placeholder="Filter cards..." oninput="cseFilterPickerCards(this.value)">
                        </div>
                    </div>
                    <div class="cse-picker-grid" id="csePickerGrid"></div>
                    <button class="cse-btn primary" onclick="cseSaveSet()">Save Set</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('open'));

    // Populate the official set dropdown
    csePopulateSetDropdown();
}

// Close editor modal
function closeCustomSetEditor() {
    const modal = document.getElementById('customSetEditorModal');
    if (modal) {
        modal.classList.remove('open');
        setTimeout(() => modal.remove(), 200);
    }
}

// Navigate between steps
function cseGoToCardPicker() {
    const name = document.getElementById('cseSetName').value.trim();
    if (!name) {
        document.getElementById('cseSetName').focus();
        return;
    }
    document.getElementById('cseStepMeta').classList.remove('active');
    document.getElementById('cseStepCards').classList.add('active');
}

function cseGoToMeta() {
    document.getElementById('cseStepCards').classList.remove('active');
    document.getElementById('cseStepMeta').classList.add('active');
}

// Update logo preview when URL changes
function cseUpdateLogoPreview(url) {
    const preview = document.getElementById('cseLogoPreview');
    if (!preview) return;
    if (url && url.trim()) {
        preview.innerHTML = `<img src="${url.trim()}" alt="Logo preview" onerror="this.parentElement.innerHTML='Invalid URL'">`;
    } else {
        preview.innerHTML = '';
    }
}

// Populate official set dropdown grouped by block (Pokemon + Lorcana)
function csePopulateSetDropdown() {
    const select = document.getElementById('cseSetSelect');
    if (!select) return;

    // Group Pokemon sets by block
    const blockGroups = {};
    Object.keys(cardSets).forEach(setKey => {
        const setData = cardSets[setKey];
        const block = setData.block || 'Other';
        if (!blockGroups[block]) blockGroups[block] = [];
        blockGroups[block].push({ key: setKey, name: setData.displayName || setData.name });
    });

    // Add Pokemon optgroups
    Object.keys(blockGroups).forEach(block => {
        const group = document.createElement('optgroup');
        group.label = block;
        blockGroups[block].forEach(set => {
            const opt = document.createElement('option');
            opt.value = set.key;
            opt.textContent = set.name;
            group.appendChild(opt);
        });
        select.appendChild(group);
    });

    // Add Lorcana sets as a separate group
    if (typeof lorcanaCardSets !== 'undefined' && Object.keys(lorcanaCardSets).length > 0) {
        const lorcanaGroup = document.createElement('optgroup');
        lorcanaGroup.label = 'Disney Lorcana';
        Object.keys(lorcanaCardSets).forEach(setKey => {
            const setData = lorcanaCardSets[setKey];
            const opt = document.createElement('option');
            opt.value = 'lorcana:' + setKey;
            opt.textContent = setData.displayName || setData.name;
            lorcanaGroup.appendChild(opt);
        });
        select.appendChild(lorcanaGroup);
    }
}

// Load cards from an official set into the picker grid (Pokemon or Lorcana)
function cseLoadOfficialSet(setKey) {
    const grid = document.getElementById('csePickerGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!setKey) return;

    // Check if it's a Lorcana set (prefixed with "lorcana:")
    const isLorcana = setKey.startsWith('lorcana:');
    const actualSetKey = isLorcana ? setKey.replace('lorcana:', '') : setKey;

    const setData = isLorcana ? lorcanaCardSets[actualSetKey] : cardSets[actualSetKey];
    if (!setData) return;

    const setDisplayName = setData.displayName || setData.name;

    setData.cards.forEach(card => {
        let apiId, imgUrl;

        if (isLorcana) {
            apiId = `lorcana-${actualSetKey}-${card.number}`;
            // Use Dreamborn CDN for Lorcana card images
            if (card.dreambornId) {
                imgUrl = `https://cdn.dreamborn.ink/images/en/cards/${card.dreambornId}`;
            } else {
                imgUrl = '';
            }
        } else {
            const apiSetId = TCG_API_SET_IDS[actualSetKey] || actualSetKey;
            apiId = `${apiSetId}-${card.number}`;
            imgUrl = `https://images.pokemontcg.io/${apiSetId}/${card.number}.png`;
        }

        const isSelected = Object.values(_editorSelectedCards).some(c => c.apiId === apiId);

        const cardEl = document.createElement('div');
        cardEl.className = 'cse-picker-card' + (isSelected ? ' selected' : '');
        cardEl.setAttribute('data-card-name', card.name.toLowerCase());
        cardEl.setAttribute('data-card-number', card.number);

        cardEl.innerHTML = `
            <div class="cse-picker-card-img">
                <img src="${imgUrl}" alt="${card.name}" loading="lazy" onerror="this.style.opacity='0.3'">
            </div>
            <div class="cse-picker-card-info">
                <span class="cse-picker-card-name">${card.name}</span>
                <span class="cse-picker-card-num">#${card.number}</span>
            </div>
        `;

        cardEl.onclick = () => {
            if (cardEl.classList.contains('selected')) {
                // Deselect — find and remove
                const toRemove = Object.entries(_editorSelectedCards).find(([k, v]) => v.apiId === apiId);
                if (toRemove) delete _editorSelectedCards[toRemove[0]];
                cardEl.classList.remove('selected');
            } else {
                // Select — add new card
                const newCard = {
                    number: _editorCardCounter++,
                    name: card.name,
                    rarity: card.rarity,
                    type: card.type || (isLorcana ? 'character' : 'pokemon'),
                    setOrigin: `${setDisplayName}`,
                    apiId: apiId,
                    releaseDate: setData.releaseDate || '',
                    originalNumber: String(card.number),
                    region: ''
                };
                if (isLorcana && card.dreambornId) {
                    newCard.dreambornId = card.dreambornId;
                }
                _editorSelectedCards[newCard.number] = newCard;
                cardEl.classList.add('selected');
            }
            cseUpdateCount();
        };

        grid.appendChild(cardEl);
    });
}

// Filter picker cards by search
function cseFilterPickerCards(query) {
    const grid = document.getElementById('csePickerGrid');
    if (!grid) return;
    const q = query.toLowerCase();
    grid.querySelectorAll('.cse-picker-card').forEach(card => {
        const name = card.getAttribute('data-card-name') || '';
        const num = card.getAttribute('data-card-number') || '';
        card.style.display = (name.includes(q) || num.includes(q)) ? '' : 'none';
    });
}

// Update selected count display
function cseUpdateCount() {
    const el = document.getElementById('cseSelectedCount');
    if (el) el.textContent = `${Object.keys(_editorSelectedCards).length} cards selected`;
}

// Slugify a name into a setKey
function cseSlugify(name) {
    return name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 40);
}

// Save (create or update) the custom set to Firebase
async function cseSaveSet() {
    const name = document.getElementById('cseSetName').value.trim();
    if (!name) { alert('Please enter a set name.'); return; }
    if (Object.keys(_editorSelectedCards).length === 0) { alert('Please add at least one card.'); return; }

    const themeColor = document.getElementById('cseThemeColor').value;
    const logoUrl = document.getElementById('cseLogoUrl').value.trim();
    const description = document.getElementById('cseDescription').value.trim();
    const setDate = document.getElementById('cseSetDate').value;

    // Determine set key
    const setKey = _editorSetKey || cseSlugify(name);
    if (!setKey) { alert('Invalid set name.'); return; }

    // Build cards object (keyed by card number)
    const cardsObj = {};
    Object.values(_editorSelectedCards).forEach(card => {
        cardsObj[card.number] = {
            name: card.name,
            rarity: card.rarity,
            type: card.type || 'pokemon',
            setOrigin: card.setOrigin || '',
            apiId: card.apiId || '',
            releaseDate: card.releaseDate || '',
            originalNumber: card.originalNumber || '',
            region: card.region || ''
        };
        if (card.variants && Array.isArray(card.variants)) {
            cardsObj[card.number].variants = card.variants;
        }
        if (card.dreambornId) {
            cardsObj[card.number].dreambornId = card.dreambornId;
        }
    });

    const fbSet = {
        name: name,
        displayName: name,
        description: description,
        totalCards: Object.keys(cardsObj).length,
        singleVariantOnly: true,
        themeColor: themeColor,
        logoUrl: logoUrl,
        setDate: setDate,
        updatedAt: firebase.database.ServerValue.TIMESTAMP,
        createdBy: currentUser ? currentUser.uid : 'unknown',
        cards: cardsObj
    };

    // Only set createdAt on new sets
    if (!_editorSetKey) {
        fbSet.createdAt = firebase.database.ServerValue.TIMESTAMP;
    }

    try {
        const db = firebase.database();
        await db.ref('collections/' + activeCollectionId + '/customSets/' + setKey).update(fbSet);
        closeCustomSetEditor();
        // Firebase listener will auto-refresh the UI
    } catch (err) {
        console.error('Error saving custom set:', err);
        alert('Failed to save set. Please try again.');
    }
}

// Delete a custom set
async function deleteCustomSet(setKey) {
    if (!setKey || !customCardSets[setKey]) return;
    const setName = customCardSets[setKey].displayName || setKey;

    if (!confirm(`Delete "${setName}"? This will remove the set definition and all progress data for all collection members.`)) {
        return;
    }

    try {
        const db = firebase.database();
        // Remove set definition
        await db.ref('collections/' + activeCollectionId + '/customSets/' + setKey).remove();
        // Remove progress data
        await db.ref('collections/' + activeCollectionId + '/data/custom-' + setKey).remove();

        // If this was the active set, deselect
        if (currentCustomSet === setKey) {
            currentCustomSet = null;
        }
        // Firebase listener will auto-refresh the UI
    } catch (err) {
        console.error('Error deleting custom set:', err);
        alert('Failed to delete set. Please try again.');
    }
}
