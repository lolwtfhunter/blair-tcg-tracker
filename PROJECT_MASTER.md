# Blair Pokemon Master Set Tracker - Project Master Document

**Version:** 2.0.0  
**Last Updated:** February 14, 2026  
**Live URL:** https://lolwtfhunter.github.io/blair-pokemon-tracker/  
**Sync Code:** Blair2024

---

## 📋 PROJECT OVERVIEW

A web-based Pokemon TCG collection tracker for tracking 1,076 cards across 5 sets with real-time cloud sync between devices. Built for Blair and family to track their master set collection with proper variant tracking (Regular, Reverse Holo, Poké Ball, Master Ball).

### **Core Features**
- ✅ Track 1,076 cards across 5 Pokemon TCG sets
- ✅ Variant tracking per card (Regular, Reverse Holo, Poké Ball, Master Ball)
- ✅ Real-time sync between devices via Firebase
- ✅ Password-protected with sync code
- ✅ Mobile-optimized responsive design
- ✅ Progress tracking and statistics
- ✅ Persistent storage (survives page refresh)

---

## 🗂️ PROJECT FILES

### **Required Files (Must Upload to GitHub)**
1. **index.html** (47KB) - Main application
2. **card-data.json** (3.6KB) - Card metadata and rarity rules

### **File Locations**
- Repository: https://github.com/lolwtfhunter/blair-pokemon-tracker
- Both files must be in repository **root directory**

---

## 🎴 CARD SETS & DATA

### **Set 1: Journey Together (190 cards)**
- Main set: Cards 1-159
- Secret rares: Cards 160-190
- EX cards: #11, 24, 30, 31, 43, 51, 53, 56, 69, 75, 79, 94, 98, 111, 114, 121
- Trainers: #142-158
- Energy: #159
- Variants: Regular + Reverse Holo (EX/Secrets = single checkbox)

### **Set 2: Destined Rivals (244 cards)**
- Main set: Cards 1-182
- Secret rares: Cards 183-244
- Variants: Regular + Reverse Holo (EX/Secrets = single checkbox)

### **Set 3: Prismatic Evolutions (217 cards)**
- Main set: Cards 1-131
- Secret rares: Cards 132-217
- EX cards: #6, 11, 12, 14, 17, 22, 28, 32, 37, 39, 42, 48, 52, 54, 58, 62, 70, 73, 76, 80, 84, 88, 91
- Trainers: #92-131
- **Special:** Poké Ball & Master Ball variants
  - Pokemon: Regular + Reverse + Poké Ball + Master Ball (4 variants)
  - Trainers: Regular + Reverse + Poké Ball (3 variants)
  - EX/Secrets: Single checkbox only

### **Set 4: Phantasmal Flames (130 cards)**
- Main set: Cards 1-94
- Secret rares: Cards 95-130
- EX cards: #4, 13, 18, 29, 36, 41, 56, 61, 70, 84
- Trainers: #85-94
- Variants: Regular + Reverse Holo (EX/Secrets = single checkbox)

### **Set 5: Ascended Heroes (295 cards)**
- Main set: Cards 1-217
- Secret rares: Cards 218-295
- Variants: Regular + Reverse Holo (EX/Secrets = single checkbox)

### **Total Collection**
- 1,076 total cards
- ~2,500+ total variants to track

---

## 🏗️ TECHNICAL ARCHITECTURE

### **Frontend**
- Pure HTML/CSS/JavaScript (no frameworks)
- Responsive grid layout (mobile-first)
- Dark theme (#1a1a2e background)

### **Data Storage**
- **Local:** localStorage (temporary, device-specific)
- **Cloud:** Firebase Realtime Database (synced, multi-device)
- **Card Data:** JSON file (read-only, loaded on startup)

### **Cloud Sync (Firebase)**
- Project: blair-pokemon-tracker
- Database: Realtime Database
- Collection path: `/collections/Blair2024`
- Sync: Bidirectional, real-time
- Authentication: Sync code only (no user accounts)

---

## 🔧 HOW IT WORKS

### **1. Application Startup**
```
User opens URL
  ↓
index.html loads
  ↓
Load card-data.json → Build cardSets
  ↓
Show sync code prompt (if not stored)
  ↓
User enters "Blair2024"
  ↓
Validate code → Connect to Firebase
  ↓
Load saved progress from Firebase
  ↓
Render all 1,076 cards with variants
  ↓
Ready to use!
```

### **2. Card Data Loading**
```javascript
// Located in card-data.json
{
  "journey-together": {
    "totalCards": 190,
    "mainSet": 159,
    "exCards": [11, 24, 30, ...],
    "secretRareStart": 160,
    "trainerCards": [142, 143, ...],
    "hasPokeBallVariant": false,
    "hasMasterBallVariant": false
  }
}

// JavaScript builds cards dynamically
for (cardNumber 1 to totalCards) {
  if (cardNumber in exCards) → rarity = 'ex'
  else if (cardNumber >= secretRareStart) → rarity = 'secret'
  else if (cardNumber in trainerCards) → rarity = 'trainer'
  else → rarity = 'common'
}
```

### **3. Variant Determination**
```javascript
function getVariants(card, setKey) {
  // EX and Secret Rares
  if (card.rarity === 'ex' || card.rarity === 'secret') {
    return ['single']; // One checkbox: "Collected"
  }
  
  // Prismatic Evolutions - Pokemon
  if (setKey === 'prismatic-evolutions' && card.type === 'pokemon') {
    return ['regular', 'reverse-holo', 'pokeball', 'masterball'];
  }
  
  // Prismatic Evolutions - Trainers
  if (setKey === 'prismatic-evolutions' && card.type === 'trainer') {
    return ['regular', 'reverse-holo', 'pokeball'];
  }
  
  // Default for all other cards
  return ['regular', 'reverse-holo'];
}
```

### **4. Real-Time Sync**
```javascript
// When user checks a variant
toggleVariant(setKey, cardNumber, variant) {
  1. Update local state
  2. Save to localStorage (backup)
  3. Save to Firebase → Triggers sync on other devices
}

// Firebase listener (on all devices)
firebase.database().ref('collections/Blair2024').on('value', (snapshot) => {
  1. Receive updated data
  2. Update UI to reflect changes
  3. Update progress statistics
});
```

### **5. Sync Code Security**
- Hardcoded valid code: `Blair2024`
- Validated on client-side before Firebase connection
- Firebase rules restrict access to `/collections/Blair2024` path only
- Double-layer security: App validation + Database rules

---

## 🔐 SECURITY IMPLEMENTATION

### **Sync Code Protection**
```javascript
const VALID_SYNC_CODE = 'Blair2024';

// On page load
if (!storedCode || storedCode !== VALID_SYNC_CODE) {
  showSyncCodePrompt(); // Fullscreen modal, can't dismiss
}

// On code entry
if (enteredCode !== VALID_SYNC_CODE) {
  showError("Invalid sync code. Access denied.");
  return; // Don't proceed
}

// Code is valid
localStorage.setItem('blair_sync_code', code);
initializeFirebaseSync();
```

### **Firebase Database Rules**
```json
{
  "rules": {
    "collections": {
      "Blair2024": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

### **Logout Feature**
- Small 🔄 button next to sync status
- Clears stored code and local data
- Reloads page to show sync prompt

---

## 📊 DATA STRUCTURE

### **Collection Progress (Firebase)**
```json
{
  "collections": {
    "Blair2024": {
      "journey-together": {
        "1": {
          "regular": true,
          "reverse-holo": false
        },
        "24": {
          "single": true
        }
      },
      "prismatic-evolutions": {
        "1": {
          "regular": true,
          "reverse-holo": false,
          "pokeball": true,
          "masterball": false
        }
      }
    }
  }
}
```

### **Card Data (card-data.json)**
```json
{
  "version": "2.0.0",
  "sets": {
    "journey-together": {
      "name": "Journey Together",
      "totalCards": 190,
      "mainSet": 159,
      "exCards": [11, 24, 30, ...],
      "secretRareStart": 160,
      "trainerCards": [142, 143, ...],
      "energyCards": [159],
      "hasPokeBallVariant": false,
      "hasMasterBallVariant": false
    }
  }
}
```

---

## 🎨 UI COMPONENTS

### **Key Elements**
1. **Sync Status Indicator** - Top right, shows connection state
2. **Set Selector** - 5 buttons to switch between sets
3. **Search Bar** - Filter cards by number
4. **Progress Display** - X/Y variants collected
5. **Card Grid** - Responsive 3-column grid
6. **Card Items** - Card number, rarity badge, variant checkboxes
7. **Export Button** - Generate progress report

### **Variant Display**
- **Single Checkbox:** `✓ Collected` (EX/Secret rares)
- **Regular:** `⚪ Regular`
- **Reverse Holo:** `✨ Reverse Holo`
- **Poké Ball:** `⚾ Poké Ball` (Prismatic Evolutions only)
- **Master Ball:** `🔮 Master Ball` (Prismatic Evolutions Pokemon only)

---

## 🚀 DEPLOYMENT

### **GitHub Pages Setup**
1. Repository: lolwtfhunter/blair-pokemon-tracker
2. Settings → Pages → Source: main branch, / (root)
3. Upload both files to root:
   - index.html
   - card-data.json
4. Wait 2-3 minutes for deployment
5. Access at: https://lolwtfhunter.github.io/blair-pokemon-tracker/

### **Firebase Setup**
1. Project: blair-pokemon-tracker
2. Realtime Database enabled
3. Rules configured (see Security section)
4. SDK loaded via CDN in index.html

### **Testing Checklist**
- [ ] Open URL on phone 1
- [ ] Enter sync code "Blair2024"
- [ ] Check a card variant
- [ ] Open URL on phone 2
- [ ] Enter same sync code
- [ ] Verify card is checked on phone 2
- [ ] Check different card on phone 2
- [ ] Verify it syncs to phone 1

---

## 🔄 UPDATING THE TRACKER

### **To Add New Sets**
1. Edit `card-data.json`
2. Add new set object with metadata
3. Add set button to index.html (line ~559-563)
4. Add set section to HTML (line ~573-583)
5. Commit both files to GitHub

### **To Update Card Lists**
1. Edit `card-data.json` only
2. Update EX card arrays, trainer arrays, etc.
3. Commit to GitHub
4. Changes apply automatically (no HTML edits needed)

### **To Change Sync Code**
1. Edit index.html line ~628: `const VALID_SYNC_CODE = 'NewCode';`
2. Update Firebase rules to match new code
3. Both users click 🔄 logout button
4. Enter new code on both devices

---

## 🐛 TROUBLESHOOTING

### **Cards Not Displaying**
- Check browser console for errors
- Verify card-data.json uploaded to GitHub
- Hard refresh browser (Ctrl+Shift+R)
- Check both files in repository root

### **Sync Not Working**
- Verify both devices using same sync code
- Check Firebase console for data
- Verify network connection
- Check sync status indicator (top right)

### **Wrong Variants Showing**
- Verify card-data.json has correct EX card lists
- Check rarity detection logic in index.html
- Verify set-specific variant rules

### **Testing Locally on iOS Fails**
- iOS blocks local file access
- Must test on GitHub Pages, not local files
- Upload to GitHub to test properly

---

## 📝 KNOWN LIMITATIONS

1. **Card Names:** Currently shows "#001", "#002" instead of real names
2. **Card Images:** No card images (placeholder icons only)
3. **Manual EX Lists:** EX cards must be manually listed in JSON
4. **No Card Details:** No HP, attacks, or card text
5. **Single User Auth:** One sync code for all family members

---

## 🎯 FUTURE ENHANCEMENTS

### **Potential Additions**
- Real card names from official sources
- Card images from Pokemon TCG API
- Price tracking integration
- Export to CSV/Excel
- Multiple user accounts (not just one sync code)
- Card condition tracking (Near Mint, Played, etc.)
- Trade/wishlist functionality
- Duplicate tracking (# of copies owned)

### **Technical Improvements**
- Compress card-data.json for faster loading
- Add service worker for offline functionality
- Implement better error handling
- Add loading indicators
- Optimize Firebase queries

---

## 📞 SUPPORT INFORMATION

### **For Users (Blair & Family)**
- **Access URL:** https://lolwtfhunter.github.io/blair-pokemon-tracker/
- **Sync Code:** Blair2024
- **Logout:** Click 🔄 button next to "Synced ✓"
- **Problem?** Refresh page or re-enter sync code

### **For Developers**
- **GitHub Repo:** https://github.com/lolwtfhunter/blair-pokemon-tracker
- **Firebase Project:** blair-pokemon-tracker
- **Tech Stack:** HTML/CSS/JS + Firebase Realtime Database
- **CDN Dependencies:** Firebase SDK v10.7.1

---

## 📊 PROJECT STATISTICS

- **Total Cards:** 1,076
- **Total Variants:** ~2,500+
- **Total Sets:** 5
- **Code Lines:** ~1,300 (index.html)
- **Data Size:** 3.6KB (card-data.json)
- **App Size:** 47KB (index.html)
- **Dependencies:** Firebase SDK only (loaded via CDN)

---

## 🔑 KEY CODE FUNCTIONS

### **loadCardData()**
Loads card-data.json and builds cardSets object with proper rarities.

### **getVariants(card, setKey)**
Determines which variant checkboxes to show based on card rarity and set.

### **toggleVariant(setKey, cardNumber, variant)**
Updates collection progress and syncs to Firebase when checkbox clicked.

### **renderCards(setKey)**
Renders all cards for a set with proper variant checkboxes.

### **updateProgress()**
Calculates and displays collection statistics (X/Y variants).

### **initializeFirebaseSync()**
Connects to Firebase and sets up real-time sync listeners.

### **showSyncCodePrompt()**
Displays fullscreen modal requiring valid sync code entry.

---

## 📅 VERSION HISTORY

- **v2.0.0** (Feb 14, 2026) - Card data system with proper rarity detection
- **v1.5.0** (Feb 14, 2026) - Mandatory sync code authentication
- **v1.0.0** (Feb 14, 2026) - Initial release with Firebase sync

---

## 🏁 QUICK REFERENCE

**Live URL:** https://lolwtfhunter.github.io/blair-pokemon-tracker/  
**Sync Code:** Blair2024  
**Repository:** https://github.com/lolwtfhunter/blair-pokemon-tracker  
**Files to Upload:** index.html + card-data.json  
**Firebase Project:** blair-pokemon-tracker  

**Logout:** Click 🔄 button  
**Change Code:** Edit VALID_SYNC_CODE in index.html line ~628  
**Add Cards:** Edit card-data.json  
**Support:** Hard refresh browser or re-enter sync code  

---

*This is the single source of truth for the Blair Pokemon Master Set Tracker project. Keep this file updated with any changes.*
