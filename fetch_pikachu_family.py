#!/usr/bin/env python3
"""
Fetch all Pichu, Pikachu, and Raichu cards from the Pokemon TCG data repository.
"""

import json
import urllib.request
import time
import re
import sys

GITHUB_RAW_BASE = "https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master"

def fetch_json(url, retries=3):
    """Fetch JSON from a URL with retries."""
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url)
            req.add_header('User-Agent', 'Pokemon-Card-Tracker/1.0')
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode('utf-8'))
        except Exception as e:
            if attempt < retries - 1:
                print(f"  Retry {attempt+1} for {url}: {e}")
                time.sleep(1)
            else:
                print(f"  FAILED to fetch {url}: {e}")
                return None

def main():
    # Step 1: Get the list of all set files
    print("Fetching set file list...")
    file_list_url = "https://api.github.com/repos/PokemonTCG/pokemon-tcg-data/contents/cards/en"
    file_list = fetch_json(file_list_url)
    if not file_list:
        print("Failed to fetch file list!")
        sys.exit(1)

    set_files = sorted([item['name'] for item in file_list if item['name'].endswith('.json')])
    print(f"Found {len(set_files)} set files")

    # Step 2: Fetch the sets metadata for release dates and series info
    print("Fetching sets metadata...")
    sets_url = f"{GITHUB_RAW_BASE}/sets/en.json"
    sets_data = fetch_json(sets_url)
    if not sets_data:
        print("Failed to fetch sets data!")
        sys.exit(1)

    # Build a lookup by set ID
    sets_lookup = {}
    for s in sets_data:
        sets_lookup[s['id']] = s
    print(f"Loaded {len(sets_lookup)} sets")

    # Step 3: Download each set file and filter for Pichu/Pikachu/Raichu
    target_names = ['pichu', 'pikachu', 'raichu']
    all_matching_cards = []

    for i, set_file in enumerate(set_files):
        set_id = set_file.replace('.json', '')
        url = f"{GITHUB_RAW_BASE}/cards/en/{set_file}"

        if (i + 1) % 20 == 0 or i == 0:
            print(f"Processing set {i+1}/{len(set_files)}: {set_id}...")

        cards = fetch_json(url)
        if cards is None:
            continue

        for card in cards:
            card_name = card.get('name', '')
            card_name_lower = card_name.lower()

            # Check if any of our target Pokemon names appear in the card name
            matched = False
            for target in target_names:
                if target in card_name_lower:
                    matched = True
                    break

            if matched:
                # Get set info
                set_info = sets_lookup.get(set_id, {})

                rarity = card.get('rarity', None)
                if rarity is None:
                    rarity = "Unknown"

                result = {
                    "apiId": card.get('id', ''),
                    "name": card_name,
                    "number": card.get('number', ''),
                    "setName": set_info.get('name', 'Unknown'),
                    "setSeries": set_info.get('series', 'Unknown'),
                    "setId": set_id,
                    "releaseDate": set_info.get('releaseDate', ''),
                    "rarity": rarity
                }
                all_matching_cards.append(result)

    print(f"\nFound {len(all_matching_cards)} matching cards total")

    # Step 4: Sort by releaseDate ascending, then setName, then number
    def sort_key(card):
        # releaseDate format is YYYY/MM/DD
        release = card.get('releaseDate', '') or ''
        set_name = card.get('setName', '') or ''
        num = card.get('number', '') or ''
        # Try to convert number to int for proper numeric sorting
        try:
            num_sort = int(re.sub(r'[^0-9]', '', num)) if num else 0
        except ValueError:
            num_sort = 0
        return (release, set_name, num_sort, num)

    all_matching_cards.sort(key=sort_key)

    # Step 5: Write to output file
    output_path = '/home/user/blair-pokemon-tracker/pikachu-research.json'
    with open(output_path, 'w') as f:
        json.dump(all_matching_cards, f, indent=2)

    print(f"Wrote {len(all_matching_cards)} cards to {output_path}")

    # Print summary
    pichu_count = sum(1 for c in all_matching_cards if 'pichu' in c['name'].lower())
    pikachu_count = sum(1 for c in all_matching_cards if 'pikachu' in c['name'].lower())
    raichu_count = sum(1 for c in all_matching_cards if 'raichu' in c['name'].lower())
    print(f"\nBreakdown:")
    print(f"  Pichu cards: {pichu_count}")
    print(f"  Pikachu cards: {pikachu_count}")
    print(f"  Raichu cards: {raichu_count}")

if __name__ == '__main__':
    main()
