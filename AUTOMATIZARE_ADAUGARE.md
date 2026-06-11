# 🎵 FlyDBX - Adăugare Automatizată Piese Noi

## Descriere
Acest script automatizează complet procesul de adăugare a unei piese noi în site-ul FlyDBX. Cu un singur click sau o simplă comandă, poți actualiza site-ul local, face commit pe GitHub și declanșa deploy-ul automat pe Cloudflare Pages.

## Cum Funcționează

### Varianta 1: Interactiv (Recomandat)
Rulezi scriptul și introduci datele când ți se cere:

```bash
python3 add_song.py
```

### Varianta 2: Cu Parametri Directi
Poți trece toate datele direct în linia de comandă:

```bash
python3 add_song.py "Titlu Piesa" "Nume Album" "nume_icon.webp"
```

### Varianta 3: Prin Chat cu AI (Codex-style)
**Aceasta este metoda cea mai simplă!** Doar scrii în chat:

```
Adaugă piesa nouă:
- Titlu: Midnight Dreams
- Album: Ethereal Journeys  
- Icon: midnight-dreams.webp
```

Și eu voi rula automat scriptul pentru tine!

## Ce Face Scriptul Automatisch

1. ✅ **Validează fișierul icon** - Verifică dacă `assets/{nume_icon}.webp` există
2. ✅ **Actualizează index.html** - Adaugă noua intrare în stilul FlyDBX
3. ✅ **Adaugă cache-buster** - Pentru a forța reîncărcarea conținutului
4. ✅ **Git commit automat** - Cu mesaj descriptiv
5. ✅ **Push pe GitHub** - Trimite modificările
6. ✅ **Trigger deploy Cloudflare** - Deploy automat în câteva minute

## Exemplu Complet

### Input:
```bash
python3 add_song.py "Summer Breeze" "Coastal Vibes" "summer-breeze.webp"
```

### Output generat în index.html:
```html
<div class="media-row" data-cache-buster="1704892800">
  <img alt="Summer Breeze" class="thumb" loading="lazy" src="assets/summer-breeze.webp">
  <div class="media-content">
    <h3>Summer Breeze</h3>
    <p class="en">Coastal Vibes</p>
    <div class="btns">
      <button class="btn play-btn" data-track="summer-breeze">▶ Play</button>
    </div>
  </div>
</div>
```

### Commit pe GitHub:
```
🎵 Adăugat piesa nouă: Summer Breeze din albumul Coastal Vibes
```

## Cerințe Prealabile

Înainte de a folosi scriptul, asigură-te că:

1. ✅ Fișierul icon există în `assets/` (ex: `assets/midnight-dreams.webp`)
2. ✅ Ai configurat Git cu credențialele tale
3. ✅ Repository-ul este conectat la GitHub
4. ✅ Cloudflare Pages este configurat pentru deploy automat

## Configurare Git (Dacă nu e deja făcut)

```bash
git config --global user.name "Numele Tău"
git config --global user.email "email@exemplu.com"
```

## Flux Complet de Lucru

### Pasul 1: Pregătește Asset-urile
Copiază fișierele necesare în folderul `assets/`:
- Icon-ul piesei (format .webp recomandat)
- Opțional: fișierul audio (.mp3) dacă vrei să funcționeze player-ul

### Pasul 2: Rulează Scriptul
```bash
python3 add_song.py
```

### Pasul 3: Confirmă
Verifică rezumatul și apasă `y` pentru confirmare.

### Pasul 4: Așteaptă Deploy-ul
Scriptul va face automat:
- Actualizarea `index.html`
- Commit pe Git
- Push pe GitHub
- **Cloudflare Pages va detecta schimbarea și va face deploy automat în 1-3 minute**

## Integrare cu AI Assistant

Poți să-mi ceri direct să adaug o piesă nouă prin chat. Doar furnizează:

```
Titlu: [numele piesei]
Album: [numele albumului]
Icon: [nume_fisier.webp]
```

Eu voi rula scriptul automat și îți voi arăta rezultatul!

## Depanare

### Eroare: "Fișierul nu există"
Asigură-te că fișierul icon este în folderul `assets/` cu numele exact specificat.

### Eroare: "Git push failed"
Verifică:
- Ai făcut `git push` manual înainte?
- Credentialele GitHub sunt configurate corect?
- Ai permisiuni de write pe repository?

### Deploy-ul nu apare pe Cloudflare
1. Verifică GitHub Actions/Deployments pentru erori
2. Cloudflare Pages poate dura 2-5 minute pentru deploy
3. Hard refresh la browser (Ctrl+Shift+R)

## Structura Fișierelor

```
/workspace/
├── add_song.py          # Scriptul principal
├── index.html           # Fișierul care se actualizează
├── assets/              # Folderul cu imagini și audio
│   ├── cover1.webp
│   ├── cover2.webp
│   └── ...
└── .git/                # Repository Git
```

## Sfaturi Pro

1. **Nume consistente**: Folosește același format pentru numele fișierelor (ex: `titlu-piesa.webp`)
2. **Optimizare imagini**: Comprimă imaginile webp înainte de upload
3. **Backup**: Scriptul nu face backup, deci verifică modificările înainte de commit
4. **Test local**: Poți testa modificările local înainte de push (`git reset --hard` dacă nu-ți plac)

## Autor
Generat pentru FlyDBX - Cinematic Edition

## Licență
MIT License - Folosește liber!
