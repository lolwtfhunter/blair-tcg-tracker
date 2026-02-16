// Global state, constants, and rarity configuration

// Global state
let cardSets = {};
let customCardSets = {};
let lorcanaCardSets = {};
let collectionProgress = {};
let currentSet = null; // No set selected by default
let currentCustomSet = null;
let currentLorcanaSet = null; // No Lorcana set selected by default
let customSetLangFilter = {}; // Per-set language filter: 'EN' or 'JP'
let activeRarityFilters = {}; // Maps setKey → Set of active rarity strings
let firebase_db = null;
let firebase_ref = null;

const SYNC_CODE = 'Blair2024';
const SYNC_CODE_KEY = 'blair_sync_code';

// Pokemon TCG API set ID mapping (for card images from pokemontcg.io CDN)
const TCG_API_SET_IDS = {
    'prismatic-evolutions': 'sv8pt5',
    'journey-together': 'sv9',
    'destined-rivals': 'sv10',
    'mega-evolution': 'me1',
    'phantasmal-flames': 'me2',
    'ascended-heroes': 'me2pt5',
    'celebrations': 'cel25',
    'surging-sparks': 'sv8'
};

// TCGdex API set mapping: { series, setId } (for assets.tcgdex.net CDN)
const TCGDEX_SET_IDS = {
    'prismatic-evolutions': { series: 'sv', set: 'sv08.5' },
    'journey-together':     { series: 'sv', set: 'sv09' },
    'destined-rivals':      { series: 'sv', set: 'sv10' },
    'mega-evolution':       { series: 'me', set: 'me01' },
    'phantasmal-flames':    { series: 'me', set: 'me02' },
    'ascended-heroes':      { series: 'me', set: 'me02.5' },
    'celebrations':         { series: 'swsh', set: 'cel25' },
    'surging-sparks':       { series: 'sv', set: 'sv08' }
};

// Variant configurations
const variantLabels = {
    'single': { label: 'Collected', icon: '✓' },
    'regular': { label: 'Regular', icon: '⚪' },
    'holo': { label: 'Holo', icon: '💎' },
    'reverse-holo': { label: 'Reverse Holo', icon: '✨' },
    'pokeball': { label: 'Poké Ball', icon: '⚾' },
    'masterball': { label: 'Master Ball', icon: '🔮' },
    '1st-edition': { label: '1st Edition', icon: '🥇' },
    'unlimited': { label: 'Unlimited', icon: '♾️' }
};

// All possible rarities in Pokemon TCG (future-proof)
const SINGLE_VARIANT_RARITIES = [
    'ex', 'secret', 'illustration-rare', 'special-illustration-rare',
    'ultra-rare', 'hyper-rare', 'double-rare', 'ace-spec',
    'radiant', 'amazing-rare', 'shiny-rare', 'trainer-ultra-rare',
    'gold-secret', 'promo'
];

// Rarity display names (Pokemon TCG)
const RARITY_DISPLAY_NAMES = {
    'common': 'COMMON',
    'uncommon': 'UNCOMMON',
    'rare': 'RARE',
    'ex': 'EX',
    'secret': 'SECRET',
    'illustration-rare': 'ILLUS RARE',
    'special-illustration-rare': 'SPECIAL IR',
    'ultra-rare': 'ULTRA RARE',
    'hyper-rare': 'HYPER RARE',
    'double-rare': 'DOUBLE RARE',
    'trainer-ultra-rare': 'TRAINER UR',
    'gold-secret': 'GOLD',
    'ace-spec': 'ACE SPEC',
    'radiant': 'RADIANT',
    'amazing-rare': 'AMAZING',
    'shiny-rare': 'SHINY',
    'promo': 'PROMO',
    'rare-holo': 'RARE HOLO',
    'rare-holo-gx': 'HOLO GX',
    'trainer': 'TRAINER',
    'energy': 'ENERGY',
    '1st-edition': '1ST EDITION',
    'unlimited': 'UNLIMITED'
};

// Lorcana rarity display names
const LORCANA_RARITY_DISPLAY_NAMES = {
    'common':     'COMMON',
    'uncommon':   'UNCOMMON',
    'rare':       'RARE',
    'super-rare': 'SUPER RARE',
    'legendary':  'LEGENDARY',
    'enchanted':  'ENCHANTED',
    'epic':       'EPIC',
    'iconic':     'ICONIC',
    'special':    'SPECIAL'
};

// Get display name for rarity
function getRarityDisplay(rarity) {
    return RARITY_DISPLAY_NAMES[rarity] || rarity.toUpperCase();
}

// Get display name for Lorcana rarity
function getLorcanaRarityDisplay(rarity) {
    return LORCANA_RARITY_DISPLAY_NAMES[rarity] || rarity.toUpperCase().replace(/-/g, ' ');
}

// Determine variants for a card
function getVariants(card, setKey) {
    const setData = cardSets[setKey];
    const rarity = card.rarity.toLowerCase();

    // Sets where all cards are single variant (e.g., Celebrations)
    if (setData && setData.singleVariantOnly) {
        return ['single'];
    }

    // Single checkbox rarities (EX, Ultra Rares, Illustration Rares, etc.)
    if (SINGLE_VARIANT_RARITIES.includes(rarity)) {
        return ['single'];
    }

    // Rare cards get Holo + Reverse Holo (no regular)
    if (rarity === 'rare') {
        // Special case: Prismatic Evolutions rares get extra variants
        if (setKey === 'prismatic-evolutions' && card.type !== 'trainer') {
            return ['holo', 'reverse-holo', 'pokeball', 'masterball'];
        }
        return ['holo', 'reverse-holo'];
    }

    // Prismatic Evolutions special variants for commons/uncommons
    if (setKey === 'prismatic-evolutions') {
        if (card.type === 'trainer') {
            return ['regular', 'reverse-holo', 'pokeball'];
        }
        // Regular pokemon get all 4 variants
        return ['regular', 'reverse-holo', 'pokeball', 'masterball'];
    }

    // All other cards (common, uncommon, trainer, energy): Regular + Reverse Holo
    return ['regular', 'reverse-holo'];
}

// Official Pokemon TCG sets to load (in order)
const OFFICIAL_SETS = [
    'celebrations',
    'mega-evolution',
    'phantasmal-flames',
    'ascended-heroes',
    'surging-sparks',
    'prismatic-evolutions',
    'journey-together',
    'destined-rivals'
];

// Custom sets to load
const CUSTOM_SETS = [
    'its-pikachu',
    'psyduck',
    'togepi'
];

// Lorcast API set codes (for card image fallback via api.lorcast.com)
const LORCAST_SET_CODES = {
    'first-chapter': '1',
    'rise-of-the-floodborn': '2',
    'into-the-inklands': '3',
    'ursulas-return': '4',
    'shimmering-skies': '5',
    'azurite-sea': '6',
    'archazias-island': '7',
    'reign-of-jafar': '8',
    'fabled': '9',
    'whispers-in-the-well': '10',
    'winterspell': '11'
};

// TCGCSV Pokemon group IDs (TCGPlayer category 3)
const TCGCSV_POKEMON_GROUP_IDS = {
    'celebrations': 2867,
    'surging-sparks': 23651,
    'prismatic-evolutions': 23821,
    'journey-together': 24073,
    'destined-rivals': 24269,
    'mega-evolution': 24380,
    'phantasmal-flames': 24448,
    'ascended-heroes': 24541
};

// TCGCSV Lorcana group IDs (TCGPlayer category 71)
const TCGCSV_LORCANA_GROUP_IDS = {
    'first-chapter': 22937,
    'rise-of-the-floodborn': 23303,
    'into-the-inklands': 23367,
    'ursulas-return': 23474,
    'shimmering-skies': 23536,
    'azurite-sea': 23746,
    'archazias-island': 24011,
    'reign-of-jafar': 24258,
    'fabled': 24348,
    'whispers-in-the-well': 24414,
    'winterspell': 24500
};

// TCGCSV source set group IDs for custom set cards (pokemontcg.io set ID → TCGCSV group ID)
// Used to fetch prices for individual cards in custom sets by their source set
const TCGCSV_SOURCE_SET_GROUP_IDS = {
    // WotC Era
    'base1': 604,   'base2': 635,   'base3': 630,   'base4': 605,
    'base5': 1373,  'base6': 1374,  'basep': 1418,
    'gym1': 1441,   'gym2': 1440,
    'neo1': 1396,   'neo2': 1434,   'neo3': 1389,   'neo4': 1444,
    'si1': 648,
    // e-Card Era
    'ecard1': 1375, 'ecard2': 1397, 'ecard3': 1372,
    // EX Era
    'ex1': 1393,  'ex2': 1392,  'ex3': 1376,  'ex4': 1377,
    'ex5': 1416,  'ex6': 1419,  'ex7': 1428,  'ex8': 1404,
    'ex9': 1410,  'ex10': 1398, 'ex11': 1429, 'ex12': 1378,
    'ex13': 1379, 'ex14': 1395, 'ex15': 1411, 'ex16': 1383,
    'np': 1423,
    // Diamond & Pearl Era
    'dp1': 1430, 'dp2': 1368, 'dp3': 1380, 'dp4': 1405,
    'dp5': 1390, 'dp6': 1417, 'dp7': 1369, 'dpp': 1421,
    // Platinum Era
    'pl1': 1406, 'pl2': 1367, 'pl3': 1384, 'pl4': 1391,
    'ru1': 1433,
    // HGSS Era
    'hgss1': 1402, 'hgss2': 1399, 'hgss3': 1403, 'hgss4': 1381,
    'hsp': 1453,   'col1': 1415,
    // Black & White Era
    'bw1': 1400,  'bw2': 1424,  'bw3': 1385,  'bw4': 1412,
    'bw5': 1386,  'bw6': 1394,  'bw7': 1408,  'bw8': 1413,
    'bw9': 1382,  'bw10': 1370, 'bw11': 1409, 'bwp': 1407,
    // XY Era
    'xy0': 1522,  'xy1': 1387,  'xy2': 1464,  'xy3': 1481,
    'xy4': 1494,  'xy5': 1509,  'xy6': 1534,  'xy7': 1576,
    'xy8': 1661,  'xy9': 1701,  'xy10': 1780, 'xy11': 1815,
    'xy12': 1842, 'xyp': 1451,  'g1': 1728,
    // Sun & Moon Era
    'sm1': 1863,  'sm2': 1919,  'sm3': 1957,  'sm35': 2054,
    'sm4': 2071,  'sm5': 2178,  'sm6': 2209,  'sm7': 2278,
    'sm75': 2295, 'sm8': 2328,  'sm9': 2377,  'sm10': 2420,
    'sm11': 2464, 'sm115': 2480, 'sm12': 2534, 'smp': 1861,
    'det1': 2409,
    // Sword & Shield Era
    'swsh1': 2585,  'swsh2': 2626,  'swsh3': 2675,  'swsh35': 2685,
    'swsh4': 2701,  'swsh45': 2754, 'swsh5': 2765,  'swsh6': 2807,
    'swsh7': 2848,  'swsh8': 2906,  'swsh9': 2948,  'swsh10': 3040,
    'swsh11': 3118, 'swsh11tg': 3172, 'swsh12': 3170,
    'swsh12pt5': 17688, 'swsh12pt5gg': 17689, 'swshp': 2545,
    'pgo': 3064,
    // Scarlet & Violet Era
    'sv1': 22873,   'sv2': 23120,   'sv3': 23228,   'sv3pt5': 23237,
    'sv4': 23286,   'sv4pt5': 23353, 'sv5': 23381,
    'sv8': 23651,   'sv8pt5': 23821, 'sv10': 24269,
    'svp': 22872,   'cel25': 2867,  'cel25c': 2931,
    // Mega Evolution Era
    'me2pt5': 24541, 'mep': 24451,
    // POP Series
    'pop2': 1447, 'pop3': 1442, 'pop4': 1452,
    'pop5': 1439, 'pop6': 1432, 'pop9': 1446,
    // McDonald's Promos
    'mcd14': 1692, 'mcd15': 1694, 'mcd16': 3087, 'mcd17': 2148,
    'mcd18': 2364, 'mcd19': 2555, 'mcd21': 2782, 'mcd22': 3150
};

// Lorcana sets to load
const LORCANA_SETS = [
    'first-chapter',
    'rise-of-the-floodborn',
    'into-the-inklands',
    'ursulas-return',
    'shimmering-skies',
    'azurite-sea',
    'archazias-island',
    'reign-of-jafar',
    'fabled',
    'whispers-in-the-well',
    'winterspell'
];
