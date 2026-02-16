# Lorcana Card Images

This directory contains local card images for Disney Lorcana TCG sets.

## 📁 Directory Structure

```
Images/lorcana/
├── first-chapter/              # The First Chapter (Set 1) cards
├── rise-of-the-floodborn/     # Rise of the Floodborn (Set 2) cards
├── into-the-inklands/         # Into the Inklands (Set 3) cards
├── ursulas-return/            # Ursula's Return (Set 4) cards
├── shimmering-skies/          # Shimmering Skies (Set 5) cards
├── azurite-sea/               # Azurite Sea (Set 6) cards
├── archazias-island/          # Archazia's Island (Set 7) cards
├── reign-of-jafar/            # Reign of Jafar (Set 8) cards
├── fabled/                    # Fabled (Set 9) cards
├── whispers-in-the-well/     # Whispers in the Well (Set 10) cards
├── winterspell/               # Winterspell (Set 11) cards
└── logos/                     # Set logos for buttons
```

**Note:** You typically don't need to download card images manually. The app automatically loads images from Dreamborn CDN (primary) and Lorcast API (secondary fallback). Local images are only needed for offline use or if both CDN sources fail.

## 🖼️ Adding Card Images

### Image Naming Convention

Card images should be named with **3-digit zero-padded numbers**:
- `001.jpg` - Card #1
- `002.jpg` - Card #2
- ...
- `230.jpg` - Card #230 (enchanted cards)

### Supported Formats
- `.jpg` (recommended)
- `.png`
- `.webp`

### How to Get Card Images

**Option 1: Download from Dreamborn.ink** (Recommended)
1. Visit https://dreamborn.ink/cards
2. Filter by set (e.g., "Whispers in the Well")
3. Open each card
4. Right-click the card image → "Save image as..."
5. Save to the appropriate folder with the correct number (e.g., `001.jpg`)

**Option 2: Download from Lorcania**
1. Visit https://lorcania.com/cards
2. Browse cards by set
3. Save images with proper numbering

**Option 3: Use the Mushu Report Wiki**
1. Visit https://wiki.mushureport.com/wiki/Gallery:Whispers_in_the_Well_Card_Gallery
2. Download card images from the gallery
3. Rename to match the numbering format

### Quick Reference - Whispers in the Well

**Set Info:**
- Set Code: `whi`
- Set Number: 10
- Total Cards: 240 (204 main + 36 special)
- Card Numbers:
  - Main Set: 1-204
  - Special Rarity: 205-242

**First 10 Cards:**
1. Baloo - Friend and Guardian
2. Dr. Facilier - Ambitious Schemer
3. Goofy - Everyday Hero
4. Jafar - Mastermind Magician
5. Maximus - Relentless Pursuer
6. Moana - Voyager of Oceania
7. Robin Hood - Prince of Thieves
8. Scar - Treacherous Tyrant
9. Simba - Heir to Pride Rock
10. Ursula - Power Hungry

## 🎨 Set Logos

Set logos are loaded automatically using a **4-tier cascading fallback system** (defined in `js/lorcana.js`):

1. **Local file** — `logos/{set-key}.png` (this directory)
2. **Mushu Report wiki** — Uses `Special:FilePath/{SetName}_logo.png` URL pattern
3. **Lorcana Fandom wiki** — Uses `Special:FilePath/{SetName}_Logo.png` URL pattern
4. **Inline SVG** — Generated hexagon with set-specific color and Roman numeral

**You don't need to download logos manually** — the wiki CDNs handle it automatically. Local files are only needed if you want to override the CDN logos or use them offline.

### How the wiki URLs work

MediaWiki's `Special:FilePath` redirects to the actual hosted image. The URL is constructed from the set's wiki-style display name (defined in `LORCANA_SET_WIKI_NAMES` in `js/lorcana.js`):

| Set Key | Wiki Name | Logo Filename |
|---------|-----------|---------------|
| `first-chapter` | `The_First_Chapter` | `The_First_Chapter_logo.png` |
| `rise-of-the-floodborn` | `Rise_of_the_Floodborn` | `Rise_of_the_Floodborn_logo.png` |
| `into-the-inklands` | `Into_the_Inklands` | `Into_the_Inklands_logo.png` |
| `ursulas-return` | `Ursula's_Return` | `Ursula's_Return_logo.png` |
| `shimmering-skies` | `Shimmering_Skies` | `Shimmering_Skies_logo.png` |
| `azurite-sea` | `Azurite_Sea` | `Azurite_Sea_logo.png` |
| `archazias-island` | `Archazia's_Island` | `Archazia's_Island_logo.png` |
| `fabled` | `Fabled` | `Fabled_logo.png` |
| `winterspell` | `Winterspell` | `Winterspell_logo.png` |
| `whispers-in-the-well` | `Whispers_in_the_Well` | `Whispers_in_the_Well_logo.png` |

### Adding a new set's logo

When a new Lorcana set is released:

1. Add its wiki name to `LORCANA_SET_WIKI_NAMES` in `js/lorcana.js`
2. Add its color/label to `getLorcanaSetLogoSvg()` in `js/lorcana.js`
3. The logo will automatically load from the wiki CDNs once the wiki editors upload it
4. Optionally place a local `logos/{set-key}.png` file to override (200-400px wide, transparent PNG)

### Adding local logo overrides (optional)

Place set logos in the `logos/` folder:
- `first-chapter.png` - The First Chapter logo
- `whispers-in-the-well.png` - Whispers in the Well logo

**Recommended:** 200-400px wide, transparent background (PNG)

## 🔧 Testing Your Images

After adding images:
1. Refresh your browser (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
2. Navigate to the Lorcana section
3. Select the set
4. Images should now display instead of placeholders

## ⚠️ Important Notes

- **Do not commit** card images to git (they are large files and may have copyright concerns)
- Images are in `.gitignore` and won't be tracked
- Keep images locally for personal use
- If images still don't load, check browser console (F12) for errors

## 📝 Bulk Download Script

If you want to automate downloading (requires manual setup):

```bash
#!/bin/bash
# Example: Download from a CDN if you find a working URL pattern
# for i in {1..204}; do
#   num=$(printf "%03d" $i)
#   wget "https://example.com/cards/010-$num.jpg" -O "whispers-in-the-well/$num.jpg"
# done
```

---

**Need Help?** Check the main README or open an issue on GitHub.
