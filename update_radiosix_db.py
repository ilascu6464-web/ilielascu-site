import os
import json

ALBUMS_DIR = "/Users/ilascu/L_DATA_MAC/PROGRAMARE/PlayerDBX-Native/PlayerDBXcontent/Albums"
OUTPUT_JSON = "/Users/ilascu/L_DATA_MAC/PROGRAMARE/FlyDBX/assets/albums_database.json"

def scan_albums():
    if not os.path.exists(ALBUMS_DIR):
        print(f"Eroare: Directorul {ALBUMS_DIR} nu exista.")
        return
    
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
            tracks.append(track_title)
            
        if tracks:
            albums_db.append({
                "album_title": album_name,
                "tracks_count": len(tracks),
                "tracks": tracks
            })
            
    # Write to JSON
    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(albums_db, f, indent=2, ensure_ascii=False)
        
    print(f"Succes! S-a generat baza de date RadioSIX cu {len(albums_db)} albume la: {OUTPUT_JSON}")

if __name__ == "__main__":
    scan_albums()
