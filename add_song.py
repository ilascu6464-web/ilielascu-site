#!/usr/bin/env python3
"""
Script pentru adăugarea automată a unei piese noi în FlyDBX
Actualizează index.html, face commit pe GitHub și triggeruiește deploy pe Cloudflare Pages
"""

import subprocess
import sys
import re
from datetime import datetime

def run_command(command, check=True):
    """Rulează o comandă shell și returnează rezultatul"""
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, check=check)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Eroare la executarea comenzii: {command}")
        print(f"Error: {e.stderr}")
        sys.exit(1)

def validate_inputs(titlu, album, icon_file):
    """Validează inputurile utilizatorului"""
    if not titlu or not album or not icon_file:
        print("❌ Toate câmpurile sunt obligatorii!")
        return False
    
    # Verificăm dacă fișierul icon există
    import os
    icon_path = f"assets/{icon_file}"
    if not os.path.exists(icon_path):
        print(f"❌ Fișierul {icon_path} nu există!")
        return False
    
    return True

def update_index_html(titlu, album, icon_file):
    """Actualizează fișierul index.html cu noua piesă - stil FlyDBX"""
    
    # Citim conținutul actual al index.html
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Generăm noul entry pentru piesă în stilul FlyDBX
    # Formatul este similar cu celelalte intrări din site
    timestamp = int(datetime.now().timestamp())
    titlu_slug = titlu.replace(' ', '-').lower()
    
    new_entry = f'''
<div class="media-row" data-cache-buster="{timestamp}">
<img alt="{titlu}" class="thumb" loading="lazy" src="assets/{icon_file}">
<div class="media-content">
<h3>{titlu}</h3>
<p class="en">{album}</p>
<div class="btns">
<button class="btn play-btn" data-track="{titlu_slug}">▶ Play</button>
</div>
</div>
</div>'''
    
    # Inserăm la marker-ul special
    if '<!-- NEW_SONG_MARKER -->' in content:
        content = content.replace('<!-- NEW_SONG_MARKER -->', new_entry + '\n<!-- NEW_SONG_MARKER -->')
    else:
        # Fallback: adăugăm înainte de </main>
        content = content.replace('</main>', new_entry + '\n</main>')
    
    # Scriem conținutul actualizat
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ index.html actualizat cu succes!")
    return True

def git_commit_and_push(titlu, album):
    """Face commit și push pe GitHub"""
    
    # Verificăm starea repository-ului
    run_command("git add -A")
    
    # Verificăm dacă există modificări
    status = run_command("git status --porcelain", check=False)
    if not status:
        print("⚠️  Nu există modificări de commitat.")
        return False
    
    commit_message = f"🎵 Adăugat piesa nouă: {titlu} din albumul {album}"
    run_command(f'git commit -m "{commit_message}"')
    
    # Push pe GitHub
    print("📤 Se face push pe GitHub...")
    run_command("git push origin main")
    
    print("✅ Commit și push realizate cu succes!")
    print("🚀 Cloudflare Pages va detecta modificarea și va face deploy automat!")
    return True

def main():
    print("🎵 FlyDBX - Adăugare Piesă Nouă")
    print("=" * 50)
    
    # Dacă argumentele sunt furnizate ca parametri
    if len(sys.argv) == 4:
        titlu = sys.argv[1]
        album = sys.argv[2]
        icon_file = sys.argv[3]
    else:
        # Cerem input de la utilizator
        titlu = input("🎼 Titlu piesă: ").strip()
        album = input("💿 Nume album: ").strip()
        icon_file = input("🖼️ Nume fișier icon (ex: cover.webp): ").strip()
    
    # Validăm inputurile
    if not validate_inputs(titlu, album, icon_file):
        sys.exit(1)
    
    print("\n📋 Rezumat:")
    print(f"   Titlu: {titlu}")
    print(f"   Album: {album}")
    print(f"   Icon: {icon_file}")
    print()
    
    confirm = input("Confirmi adăugarea? (y/n): ").strip().lower()
    if confirm != 'y':
        print("❌ Operațiune anulată.")
        sys.exit(0)
    
    # Actualizăm index.html
    if not update_index_html(titlu, album, icon_file):
        print("❌ Eroare la actualizarea index.html")
        sys.exit(1)
    
    # Facem commit și push
    if not git_commit_and_push(titlu, album):
        print("⚠️  Push-ul nu a fost necesar sau a eșuat.")
    
    print("\n" + "=" * 50)
    print("✅ Proces completat cu succes!")
    print(f"🌐 Site-ul tău va fi actualizat în câteva minute pe Cloudflare Pages.")

if __name__ == "__main__":
    main()
