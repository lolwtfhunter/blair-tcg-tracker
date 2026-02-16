# Images Directory

This folder stores all image assets for the Blair Pokémon TCG Tracker.

## Structure

```
Images/
├── header/          ← Header banner decoration images
│   ├── pikachu.png
│   ├── psyduck.png
│   ├── togepi.png
│   └── pokeball.png
│
└── cards/           ← Card artwork organized by set (create folders as needed)
    └── {set-key}/
        ├── 001.png
        ├── 002.png
        └── ...
```

## Card Image Naming Convention

Card images must follow this naming pattern:

- **Format:** `{3-digit zero-padded number}.png`
- **Examples:** `001.png`, `025.png`, `175.png`

The app automatically looks for card images at:
```
images/cards/{set-key}/{card-number}.png
```

If an image is not found, a "No Image" placeholder is shown gracefully.

## Adding Card Images

1. Get the card artwork as a `.png` file
2. Name it with the 3-digit card number (e.g., `001.png`)
3. Place it in the correct set folder (e.g., `images/cards/prismatic-evolutions/`)
4. The app will pick it up automatically — no code changes needed

## Recommended Image Size

- **Card images:** 400×560px (3:4 aspect ratio) works well
- **Smaller is fine** — 200×280px keeps file sizes small for mobile
- PNG with transparency or JPG both work, but name them `.png`
