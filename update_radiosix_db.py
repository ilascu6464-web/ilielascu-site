import os
import json
import re
import unicodedata

ALBUMS_DIR = "/Users/ilascu/L_DATA_MAC/PROGRAMARE/PlayerDBX-Native/PlayerDBXcontent/Albums"
OUTPUT_JSON = "/Users/ilascu/L_DATA_MAC/PROGRAMARE/FlyDBX/assets/albums_database.json"

# Only explicitly verified YouTube IDs belong here. A first search result can
# point at another song with a similar title, so new titles remain unmapped
# until their direct YouTube ID is confirmed.
VERIFIED_YOUTUBE_IDS = {
    "rumba of the moon": "XHeFZf_DgdQ",
    "transilvania": "X2emsIuSyBQ",
    "black clouds": "zrKf36tDMS4",
    "we don't ask": "JYxfT5Ums3o",
    "where is eva?": "HuIzTbNoe18",
    "where is eva": "HuIzTbNoe18",
    "pedro": "j86TgYHB9Os",
    "the caspian response": "seUt7yYsjbA",
    "museum ohne morgen": "Z8PGQtAVyVs",
    "no more midnight": "t-CGRuizfYA",
    "the synthesis of a latino": "2R9f6qs6K-E",
    "🇷🇸rakia i suze, frați pe vecie 🇲🇩": "J7ti6CGpEbU",
    "🇲🇩 argo-9's dream 🔊": "6et89lTob94",
}

UNMAPPED_TITLES = {
    "too much analog",
    "the world in chaos",
}


def normalize_title(title):
    return re.sub(r"\s+", " ", unicodedata.normalize("NFC", title).casefold()).strip()


def get_youtube_id(song_title, cache):
    norm_title = normalize_title(song_title)
    if norm_title in VERIFIED_YOUTUBE_IDS:
        return VERIFIED_YOUTUBE_IDS[norm_title]
    if norm_title in UNMAPPED_TITLES:
        return ""
    return cache.get(norm_title, "")

def scan_albums():
    if not os.path.exists(ALBUMS_DIR):
        print(f"Eroare: Directorul {ALBUMS_DIR} nu exista.")
        return

    # Load existing database to build cache
    cache = {}
    if os.path.exists(OUTPUT_JSON):
        try:
            with open(OUTPUT_JSON, "r", encoding="utf-8") as f:
                old_data = json.load(f)
                for album in old_data:
                    for track in album.get("tracks", []):
                        if isinstance(track, dict) and "title" in track and "youtube_id" in track:
                            youtube_id = track["youtube_id"]
                            if youtube_id:
                                cache[normalize_title(track["title"])] = youtube_id
        except Exception as e:
            print(f"Could not load old cache: {e}")

    albums_db = []
    
    # Get sorted list of album directories
    album_dirs = sorted([d for d in os.listdir(ALBUMS_DIR) if os.path.isdir(os.path.join(ALBUMS_DIR, d))])
    
    for album_name in album_dirs:
        album_path = os.path.join(ALBUMS_DIR, album_name)
        
        # Get all audio files in the album directory
        audio_extensions = ('.wav', '.mp3', '.m4a', '.flac', '.ogg')
        track_files = sorted([f for f in os.listdir(album_path) if f.lower().endswith(audio_extensions)])
        
        tracks = []
        for track_file in track_files:
            # Strip file extension
            track_title, _ = os.path.splitext(track_file)
            
            # Clean track titles from common suffixes if necessary
            track_title = track_title.replace(" - ROMANI KHER", "").replace(" - Suno", "").strip()

            # Resolve from verified mappings or the existing verified database.
            youtube_id = get_youtube_id(track_title, cache)

            tracks.append({
                "title": track_title,
                "youtube_id": youtube_id
            })
            
        if tracks:
            albums_db.append({
                "album_title": album_name,
                "tracks_count": len(tracks),
                "tracks": tracks
            })
            
    temp_output = f"{OUTPUT_JSON}.tmp"
    with open(temp_output, "w", encoding="utf-8") as f:
        json.dump(albums_db, f, indent=2, ensure_ascii=False)
        f.write("\n")
    os.replace(temp_output, OUTPUT_JSON)

    print(f"Succes! S-a generat baza de date RadioSIX cu {len(albums_db)} albume la: {OUTPUT_JSON}")

if __name__ == "__main__":
    scan_albums()
