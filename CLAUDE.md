# ilielascu.de

Site static personal (portofoliu) pentru Ilie Lascu, hostat pe **Cloudflare Pages**.

## Structura proiectului

```
ilielascu/
├── index.html             # Pagina principală (~30KB, CSS embedded)
├── _headers               # Configurare cache Cloudflare
├── README.txt             # Note deployment
├── CLAUDE.md              # Acest fișier
└── assets/                # ~17MB total, 56 fișiere
    ├── links.js           # Linkuri TikTok (obiect JS)
    ├── favicon.webp       # Favicon
    ├── banner.jpg         # Imagine hero
    ├── *.webp             # Artwork albume și cărți (format principal)
    └── *.jpg              # Unele imagini (about-the-moth, jack, etc.)
```

## Tehnologii

- HTML5 semantic
- CSS3 (variabile, flexbox, grid, glassmorphism, animații)
- JavaScript vanilla minimal (doar pentru butoane TikTok)
- Fonturi: Inter, Playfair Display (Google Fonts)
- **Format imagini: WebP** (principal) + JPG (secundar)

## Conținut

### Cărți
- Incursiune în imposibil (roman + podcast)
- Cine ne mângâie pe creștet (roman + podcast + PDF)
- Orbita Zero (audio thriller psihologic)

### Muzică (albume)
- New Singles
- Incursiune în Imposibil (soundtrack)
- Biography in Sound
- The Best of Collection
- Hai la joc
- Jazz Scratches
- Hop & Jazz
- ANALOG CONFLICT
- ORBITA ZERO
- ABOUT THE MOTH

## Platforme distribuție

YouTube Music, Apple Podcasts, Rumble, TikTok, Google Drive

## Configurare Cloudflare

Fișier `_headers`:
- `/index.html` → `no-cache` (mereu proaspăt)
- `/assets/*` → `max-age=31536000, immutable` (cache 1 an)

## Cache busting

Toate asset-urile folosesc query parameter pentru invalidare cache:
```
imagine.webp?v=2060
```

La modificarea unui asset, incrementează versiunea.

## Design

- Temă întunecată (fundal: `#05070a`)
- Accent auriu: `#c9a45a`
- Efect glassmorphism pe carduri
- Film grain overlay (SVG)
- Responsive: breakpoint la 720px

## Cum să adaugi conținut

### Album nou
1. Adaugă imaginea în `assets/` (format WebP recomandat, max ~200KB)
2. În `index.html`, găsește secțiunea muzică și adaugă un nou `<figure class="tile">`
3. Folosește extensia `.webp` în src (ex: `src="assets/nume.webp"`)
4. Dacă are TikTok, adaugă linkul în `assets/links.js`
5. Actualizează `?v=` pe resursele modificate

### Carte nouă
1. Adaugă imaginea în `assets/` (format WebP recomandat)
2. În `index.html`, găsește secțiunea cărți și adaugă un nou card
3. Folosește extensia `.webp` în src
4. Actualizează `?v=` pe resursele modificate

### Conversie PNG → WebP
```bash
# Instalare (o singură dată)
brew install webp

# Conversie individuală
cwebp -q 85 imagine.png -o imagine.webp
```

## Statistici assets (Ianuarie 2026)

| Metric | Valoare |
|--------|---------|
| Dimensiune totală | 17 MB |
| Fișiere | 56 |
| Format principal | WebP |
| Backup | assets_backup/ (de șters după verificare) |

## Deploy

Push la repository → Cloudflare Pages face deploy automat.
