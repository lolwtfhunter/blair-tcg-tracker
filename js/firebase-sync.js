// Firebase initialization and real-time sync

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDUZwwGKYfRzvj13bKTkYecIH19ge8oWZw",
    authDomain: "blair-pokemon-tracker.firebaseapp.com",
    databaseURL: "https://blair-pokemon-tracker-default-rtdb.firebaseio.com",
    projectId: "blair-pokemon-tracker",
    storageBucket: "blair-pokemon-tracker.firebasestorage.app",
    messagingSenderId: "169585887164",
    appId: "1:169585887164:web:16d3ff0705153848df8db9"
};

let firebase_customSets_ref = null;
let activeCollectionId = null;

// Initialize Firebase app (safe to call multiple times)
function ensureFirebaseApp() {
    if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
    }
}

// Update sync status
function updateSyncStatus(text, status) {
    document.getElementById('syncStatus').textContent = text;
    const indicator = document.getElementById('syncIndicator');
    indicator.className = 'sync-indicator ' + status;
}

// Detach current Firebase listener and reset ref
function detachFirebaseListener() {
    if (firebase_ref) {
        firebase_ref.off();
        firebase_ref = null;
    }
    if (firebase_customSets_ref) {
        firebase_customSets_ref.off();
        firebase_customSets_ref = null;
    }
}

// Rebuild custom set UI after Firebase customSets data changes
function rebuildCustomSetsUI() {
    if (typeof initCustomSetGrids === 'function') {
        initCustomSetGrids();
    }
    if (typeof renderCustomSetButtons === 'function') {
        renderCustomSetButtons();
    }
    // Re-render cards for the currently selected custom set
    if (currentCustomSet && customCardSets[currentCustomSet]) {
        if (typeof renderCustomCards === 'function') {
            renderCustomCards(currentCustomSet);
        }
    }
    if (typeof updateCustomSetButtonProgress === 'function') {
        updateCustomSetButtonProgress();
    }
}

// Initialize Firebase and set up real-time sync on a collection
function initializeFirebase(collectionId) {
    try {
        ensureFirebaseApp();
        firebase_db = firebase.database();
        activeCollectionId = collectionId;

        // Detach any existing listener before attaching new one
        detachFirebaseListener();

        firebase_ref = firebase_db.ref('collections/' + collectionId + '/data');

        // Update collection name in header
        firebase_db.ref('collections/' + collectionId + '/meta/name').once('value').then((snap) => {
            const name = snap.val();
            if (name && typeof updateCollectionNameHeader === 'function') {
                updateCollectionNameHeader(name);
            }
        });

        updateSyncStatus('Connecting...', 'syncing');

        // Listen for custom set definitions
        firebase_customSets_ref = firebase_db.ref('collections/' + collectionId + '/customSets');
        firebase_customSets_ref.on('value', (snapshot) => {
            const data = snapshot.val();
            // Clear existing custom sets and rebuild from Firebase
            customCardSets = {};
            if (data) {
                Object.keys(data).forEach(setKey => {
                    parseCustomSetFromFirebase(setKey, data[setKey]);
                });
                console.log(`✓ Loaded ${Object.keys(data).length} custom sets from Firebase`);
            } else {
                console.log('No custom sets in this collection.');
            }
            rebuildCustomSetsUI();
        });

        // Listen for collection progress data
        firebase_ref.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                collectionProgress = data;
                localStorage.setItem('pokemonVariantProgress', JSON.stringify(data));

                // Re-render all sets with synced data
                Object.keys(cardSets).forEach(setKey => {
                    renderCards(setKey);
                });
                updateSetButtonProgress();
                Object.keys(customCardSets).forEach(setKey => {
                    renderCustomCards(setKey);
                });
                updateCustomSetButtonProgress();

                updateSyncStatus('Synced', 'synced');
            } else {
                // New collection with no data — start fresh (do NOT upload stale localStorage)
                collectionProgress = {};
                localStorage.setItem('pokemonVariantProgress', JSON.stringify(collectionProgress));

                // Ensure cards are rendered even if no Firebase data
                Object.keys(cardSets).forEach(setKey => {
                    renderCards(setKey);
                });
                updateSetButtonProgress();
                Object.keys(customCardSets).forEach(setKey => {
                    renderCustomCards(setKey);
                });
                updateCustomSetButtonProgress();

                updateSyncStatus('Synced', 'synced');
            }
        });

    } catch (error) {
        console.error('Firebase error:', error);
        updateSyncStatus('Offline', 'error');

        // CRITICAL: Render cards even if Firebase fails
        Object.keys(cardSets).forEach(setKey => {
            renderCards(setKey);
        });
        updateSetButtonProgress();
        Object.keys(customCardSets).forEach(setKey => {
            renderCustomCards(setKey);
        });
        updateCustomSetButtonProgress();
    }
}
