# Instrucțiuni — Adăugare piesă nouă

## Pasul 1 — Adaugă cover-ul în assets
1. Pune fișierul cover în:
`/Users/ilascu/L_DATA_MAC/PROGRAMARE/FlyDBX/assets`
2. Folosește format `.webp`.
3. Pentru imagine nouă, folosește cache-buster în pagină: `?v=YYYYMMDDHHMM`.

## Pasul 2 — Adaugă tile în album
1. Deschide:
`/Users/ilascu/L_DATA_MAC/PROGRAMARE/FlyDBX/index.html`
2. Găsește albumul dorit (ex: `Singles 2026`).
3. În `<div class="gallery">` adaugă:

```html
<figure class="tile"><img alt="TITLUL PIESEI" loading="lazy" src="assets/numefisier.webp?v=YYYYMMDDHHMM"><figcaption>TITLUL PIESEI</figcaption></figure>
```

## Pasul 3 — TikTok
- Nu se mai adaugă link TikTok per piesă.
- Site-ul folosește doar link universal:
`https://www.tiktok.com/@ilascu99`

## Pasul 4 — Verificare scurtă
- Piesa apare o singură dată în albumul corect.
- Imaginea există în `assets/`.
- Dacă s-a cerut ordinea albumelor, ordinea din HTML este cea cerută.

## Pasul 5 — Commit + Push
Nu folosi `git add -A`. Adaugă doar fișierele cerute:

```bash
cd /Users/ilascu/L_DATA_MAC/PROGRAMARE/FlyDBX
git add index.html assets/numefisier.webp
git commit -m "Adaugat: TITLUL PIESEI"
git push origin main
```

## Verificare
- Piesa apare în galerie.
- Nu există buton TikTok separat sub tile.
- Butoanele principale de secțiune includ TikTok universal.
- Imaginea live răspunde `200 image/webp`, nu `text/html`.
