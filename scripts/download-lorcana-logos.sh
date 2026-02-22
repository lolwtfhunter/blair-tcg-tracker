#!/bin/bash
# Download Lorcana set logos from wiki sources.
# Logos are stored in Images/lorcana/logos/{set-key}.png and served as
# the primary (local) tier of the logo fallback chain.
#
# Usage: bash scripts/download-lorcana-logos.sh

set -e
cd "$(dirname "$0")/.."

LOGO_DIR="Images/lorcana/logos"
mkdir -p "$LOGO_DIR"

# Map set keys to their wiki-style names (must match LORCANA_SET_WIKI_NAMES in js/lorcana.js)
declare -A SETS=(
    ["first-chapter"]="The_First_Chapter"
    ["rise-of-the-floodborn"]="Rise_of_the_Floodborn"
    ["into-the-inklands"]="Into_the_Inklands"
    ["ursulas-return"]="Ursula's_Return"
    ["shimmering-skies"]="Shimmering_Skies"
    ["azurite-sea"]="Azurite_Sea"
    ["archazias-island"]="Archazia's_Island"
    ["reign-of-jafar"]="Reign_of_Jafar"
    ["fabled"]="Fabled"
    ["whispers-in-the-well"]="Whispers_in_the_Well"
    ["winterspell"]="Winterspell"
)

downloaded=0
failed=0

for key in "${!SETS[@]}"; do
    wiki_name="${SETS[$key]}"
    output="$LOGO_DIR/${key}.png"

    if [ -f "$output" ]; then
        echo "  skip  $key (already exists)"
        continue
    fi

    echo -n "  fetch $key ... "

    # Tier 1: Mushu Report wiki (lowercase _logo.png)
    if curl -sS -L --fail --max-time 15 -o "$output" \
        "https://wiki.mushureport.com/wiki/Special:FilePath/${wiki_name}_logo.png" 2>/dev/null; then
        echo "OK (Mushu Report)"
        ((downloaded++))
        continue
    fi

    # Tier 2: Lorcana Fandom wiki (uppercase _Logo.png)
    if curl -sS -L --fail --max-time 15 -o "$output" \
        "https://lorcana.fandom.com/wiki/Special:FilePath/${wiki_name}_Logo.png" 2>/dev/null; then
        echo "OK (Fandom)"
        ((downloaded++))
        continue
    fi

    # Tier 3: Lorcana Fandom wiki (lowercase _logo.png)
    if curl -sS -L --fail --max-time 15 -o "$output" \
        "https://lorcana.fandom.com/wiki/Special:FilePath/${wiki_name}_logo.png" 2>/dev/null; then
        echo "OK (Fandom, lowercase)"
        ((downloaded++))
        continue
    fi

    echo "FAILED (no source available)"
    rm -f "$output"
    ((failed++))
done

echo ""
echo "Done: $downloaded downloaded, $failed failed"
echo "Logos stored in $LOGO_DIR/"
[ $failed -gt 0 ] && echo "Tip: Missing logos will fall back to wiki CDN or inline SVG at runtime."
