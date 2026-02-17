// Collection CRUD, share codes, email invites, and collection switcher UI

// ── Create a new collection ────────────────────────────────────────
async function createCollection(ownerUid, name) {
    const db = firebase.database();
    const collectionRef = db.ref('collections').push();
    const collectionId = collectionRef.key;

    const shareCode = generateShareCode();

    const displayName = currentUser
        ? (currentUser.displayName || currentUser.email || 'Trainer')
        : 'Trainer';

    await collectionRef.set({
        meta: {
            name: name,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            ownerId: ownerUid,
            shareCode: shareCode
        },
        members: {
            [ownerUid]: {
                role: 'owner',
                displayName: displayName,
                joinedAt: firebase.database.ServerValue.TIMESTAMP
            }
        },
        data: {}
    });

    // Register share code for O(1) lookup
    await db.ref('shareCodes/' + shareCode).set(collectionId);

    // Add to user's collection list
    await db.ref('users/' + ownerUid + '/collections/' + collectionId).set({
        role: 'owner',
        name: name,
        joinedAt: firebase.database.ServerValue.TIMESTAMP
    });

    return collectionId;
}

function generateShareCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 to avoid confusion
    let code = '';
    for (let i = 0; i < SHARE_CODE_LENGTH; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// ── Join via share code ────────────────────────────────────────────
async function joinByShareCode(code) {
    const db = firebase.database();
    const snap = await db.ref('shareCodes/' + code.toUpperCase()).once('value');
    const collectionId = snap.val();
    if (!collectionId) return { success: false, error: 'Invalid share code.' };

    const uid = currentUser.uid;
    const displayName = currentUser.displayName || currentUser.email || 'Trainer';

    // Check if already a member
    const memberSnap = await db.ref('collections/' + collectionId + '/members/' + uid).once('value');
    if (memberSnap.exists()) return { success: false, error: 'You are already a member of this collection.' };

    // Get collection name
    const metaSnap = await db.ref('collections/' + collectionId + '/meta/name').once('value');
    const collectionName = metaSnap.val() || 'Shared Collection';

    // Add as member
    await db.ref('collections/' + collectionId + '/members/' + uid).set({
        role: 'member',
        displayName: displayName,
        joinedAt: firebase.database.ServerValue.TIMESTAMP
    });

    // Add to user's list
    await db.ref('users/' + uid + '/collections/' + collectionId).set({
        role: 'member',
        name: collectionName,
        joinedAt: firebase.database.ServerValue.TIMESTAMP
    });

    return { success: true, collectionId: collectionId, collectionName: collectionName };
}

// ── Switch active collection ───────────────────────────────────────
async function switchCollection(collectionId) {
    const uid = currentUser.uid;
    await firebase.database().ref('users/' + uid).update({ activeCollectionId: collectionId });
    detachFirebaseListener();
    initializeFirebase(collectionId);
    closeCollectionPanel();
}

// ── Email invite ───────────────────────────────────────────────────
async function sendEmailInvite(email, collectionId) {
    const db = firebase.database();
    const uid = currentUser.uid;
    const displayName = currentUser.displayName || currentUser.email || 'Trainer';

    // Get collection name
    const metaSnap = await db.ref('collections/' + collectionId + '/meta/name').once('value');
    const collectionName = metaSnap.val() || 'Shared Collection';

    const emailEncoded = encodeEmail(email);
    const inviteRef = db.ref('invites/' + emailEncoded).push();
    await inviteRef.set({
        collectionId: collectionId,
        collectionName: collectionName,
        inviterName: displayName,
        createdAt: firebase.database.ServerValue.TIMESTAMP
    });

    return true;
}

// ── Collection panel (switcher) UI ─────────────────────────────────
let collectionPanelOpen = false;

window.toggleCollectionPanel = function() {
    if (collectionPanelOpen) {
        closeCollectionPanel();
    } else {
        openCollectionPanel();
    }
};

async function openCollectionPanel() {
    // Remove existing panel if any
    let panel = document.getElementById('collectionPanel');
    let overlay = document.getElementById('collectionPanelOverlay');

    if (!panel) {
        overlay = document.createElement('div');
        overlay.id = 'collectionPanelOverlay';
        overlay.className = 'collection-panel-overlay';
        overlay.addEventListener('click', closeCollectionPanel);
        document.body.appendChild(overlay);

        panel = document.createElement('div');
        panel.id = 'collectionPanel';
        panel.className = 'collection-panel';
        document.body.appendChild(panel);
    }

    // Load user's collections
    const uid = currentUser.uid;
    const db = firebase.database();
    const userSnap = await db.ref('users/' + uid).once('value');
    const userData = userSnap.val() || {};
    const collections = userData.collections || {};
    const activeId = userData.activeCollectionId;

    let listHTML = '';
    for (const [cId, cData] of Object.entries(collections)) {
        const isActive = cId === activeId;
        listHTML += `
            <div class="collection-list-item${isActive ? ' active' : ''}" data-collection-id="${cId}">
                <div class="collection-list-item-name">${cData.name || 'Collection'}</div>
                <div class="collection-list-item-role">${cData.role || 'member'}</div>
            </div>`;
    }

    // Get share code for active collection
    let shareCodeHTML = '';
    if (activeId) {
        const metaSnap = await db.ref('collections/' + activeId + '/meta').once('value');
        const meta = metaSnap.val();
        if (meta && meta.shareCode) {
            shareCodeHTML = `
                <div style="margin-bottom:12px;padding:10px;background:rgba(255,255,255,0.05);border-radius:8px;font-size:0.85rem;">
                    <span style="opacity:0.7;">Share code:</span>
                    <strong style="color:#00ff88;letter-spacing:2px;margin-left:6px;">${meta.shareCode}</strong>
                </div>`;
        }
    }

    panel.innerHTML = `
        <div class="collection-panel-header">
            <div class="collection-panel-title">Collections</div>
            <button class="collection-panel-close" id="collectionPanelClose">&times;</button>
        </div>
        <div class="collection-panel-body">
            ${shareCodeHTML}
            ${listHTML || '<div style="opacity:0.6;font-size:0.9rem;">No collections yet.</div>'}
        </div>
        <div class="collection-panel-actions">
            <button class="collection-action-btn" id="btnNewCollection">+ New Collection</button>
            <button class="collection-action-btn" id="btnJoinCode">Join with Share Code</button>
            <button class="collection-action-btn" id="btnInviteEmail">Invite by Email</button>
        </div>`;

    // Attach events
    document.getElementById('collectionPanelClose').addEventListener('click', closeCollectionPanel);

    panel.querySelectorAll('.collection-list-item').forEach(item => {
        item.addEventListener('click', () => {
            const cId = item.dataset.collectionId;
            switchCollection(cId);
        });
    });

    document.getElementById('btnNewCollection').addEventListener('click', promptNewCollection);
    document.getElementById('btnJoinCode').addEventListener('click', promptJoinCode);
    document.getElementById('btnInviteEmail').addEventListener('click', promptInviteEmail);

    // Show
    requestAnimationFrame(() => {
        overlay.classList.add('open');
        panel.classList.add('open');
    });
    collectionPanelOpen = true;
}

function closeCollectionPanel() {
    const panel = document.getElementById('collectionPanel');
    const overlay = document.getElementById('collectionPanelOverlay');
    if (panel) panel.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    collectionPanelOpen = false;
}

// ── Panel action prompts ───────────────────────────────────────────
async function promptNewCollection() {
    const name = prompt('Collection name:');
    if (!name || !name.trim()) return;
    const uid = currentUser.uid;
    const collectionId = await createCollection(uid, name.trim());
    await switchCollection(collectionId);
}

async function promptJoinCode() {
    const code = prompt('Enter share code:');
    if (!code || !code.trim()) return;
    const result = await joinByShareCode(code.trim());
    if (result.success) {
        await switchCollection(result.collectionId);
    } else {
        alert(result.error);
    }
}

async function promptInviteEmail() {
    const email = prompt('Enter email to invite:');
    if (!email || !email.trim()) return;

    // Get active collection ID
    const uid = currentUser.uid;
    const snap = await firebase.database().ref('users/' + uid + '/activeCollectionId').once('value');
    const activeId = snap.val();
    if (!activeId) { alert('No active collection.'); return; }

    await sendEmailInvite(email.trim(), activeId);
    alert('Invite sent to ' + email.trim() + '!');
}
