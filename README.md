# FlyDBX

FlyDBX este o aplicație Electron concepută pentru a gestiona și actualiza conținutul site-ului muzical **ilielascu.de**.

## Descriere

Această aplicație permite adăugarea de piese noi în galeria site-ului, cu suport pentru:
- 🎵 **Singles** - Piese individuale cu cover art
- 💿 **Albume** - Colecții de piese
- 🎬 **Video-uri** - Conținut video
- 📖 **Cărți** - Publicații și materiale scrise
- 📥 **Descărcări** - Fișiere disponibile pentru download

## Structură Proiect

```
flydbx/
├── index.html          # Pagina principală cu tot conținutul
├── main.js             # Procesul principal Electron
├── preload.js          # Script de preîncărcare Electron
├── renderer.js         # Logica de randare UI
├── form.html           # Formular pentru upload
├── package.json        # Dependențe și configurație npm
└── assets/             # Resurse multimedia (imagini, cover-uri, favicon)
```

## Cerințe

- [Node.js](https://nodejs.org/) (v16 sau mai recent)
- npm (inclus cu Node.js)

## Instalare

```bash
# Clonează repository-ul
git clone <repository-url>
cd flydbx

# Instalează dependențele
npm install
```

## Utilizare

### Pornire aplicație

```bash
npm start
```

### Adăugare piesă nouă

1. Deschide fișierul `PROMPT_PENTRU_AI.md` pentru instrucțiuni detaliate
2. Completează datele piesei (titlu, cover)
3. Urmează pașii din prompt pentru a actualiza `index.html`
4. Încarcă fișierele noi în folderul `assets/`
5. Commit și push modificările:

```bash
git add -A
git commit -m "Adaugat: [TITLUL PIESEI]"
git push
```

## Cache-Buster

Proiectul folosește cache-busting automat pentru toate resursele din `assets/`. Fiecare resursă este încărcată cu un parametru de versiune (`?v=TIMESTAMP`) pentru a forța reîncărcarea de către browser și CDN după fiecare update.

**Important:** După fiecare modificare, încarcă atât fișierul `index.html` cât și toate fișierele din `assets/` în același deployment.

## Tehnologii

- **Electron** - Framework pentru aplicații desktop cross-platform
- **HTML5/CSS3** - Structură și stilizare modernă
- **JavaScript** - Logica aplicației
- **Google Fonts** - Inter & Playfair Display

## Design Features

- 🎨 Temă întunecată cinematică
- ✨ Efecte de film grain și animații shine
- 📱 Design responsive (mobile-friendly)
- 🖼️ Galerie grid auto-fill pentru albume/singles
- 🌐 Suport multi-limbă (Română/Engleză)

## Link-uri Externe

- [Site oficial](https://ilielascu.de)
- [TikTok](https://www.tiktok.com/@ilascu99)

## Autor

Dezvoltat pentru **Ilie Lascu**

## Licență

Toate drepturile rezervate © 2024 Ilie Lascu
