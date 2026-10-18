# FlyDBX

FlyDBX este aplicația macOS folosită pentru publicarea muzicii noi pe
`https://ilielascu.de/`.

## Structură

- `index.html` — pagina publică și catalogul curent;
- `assets/` — numai imaginile și bazele de date folosite de site;
- `main.js`, `preload.js`, `renderer.js`, `form.html` — aplicația Electron;
- `site-editor.js` — regulile pentru albume și `Recent releases`;
- `test/` — teste pentru actualizarea catalogului și baza RadioSIX;
- `scripts/audit_site.js` — verifică site-ul și imaginile;
- `scripts/build_app.sh` — reconstruiește `FlyDBX.app`;
- `scripts/publish_cli.js` — publicare din linia de comandă (local, ignorat de Git);
- `.agents/skills/flydbx-skil/` — skill-ul Antigravity pentru actualizarea site-ului;
- RadioSIX — vezi secțiunea dedicată mai jos.

## Utilizare (aplicația)

Deschide `FlyDBX.app`, alege coperta, titlul și albumul. Pentru o piesă care nu
trebuie afișată la `Ultimele lansări`, dezactivează opțiunea corespunzătoare.
Aplicația verifică Git, modifică numai `index.html` și coperta selectată, face
commit, push și verifică publicarea live.

## Utilizare (CLI)

`scripts/publish_cli.js` face același lucru din terminal: adaugă piesa în
`index.html`, rulează `npm test` și `npm run audit`, face commit doar pentru
`index.html` și copertă, apoi push pe `main` și o probă live a imaginii. Dacă
testele sau auditul eșuează, modificările sunt anulate automat.

```bash
# piesă într-un album existent, fără Recent releases
node scripts/publish_cli.js --title "Titlu" --album "Singles 2026" \
  --cover assets/titlu.webp --no-recent

# piesă în album și în Recent releases
node scripts/publish_cli.js --title "Titlu" --album "Balkan Brutal" \
  --cover assets/titlu.webp \
  --youtube "https://www.youtube.com/watch?v=VIDEO_ID&list=PLAYLIST_ID" \
  --tiktok "https://www.tiktok.com/@ilascu99"

# album nou
node scripts/publish_cli.js --title "Titlu" --album "Album Nou" \
  --cover assets/titlu.webp --new-album \
  --album-youtube "https://www.youtube.com/playlist?list=PLAYLIST_ID&index=1" \
  --youtube "https://www.youtube.com/watch?v=VIDEO_ID&list=PLAYLIST_ID"

# doar validare, fără commit sau push
node scripts/publish_cli.js ... --dry-run
```

Opțiuni: `--title`, `--album`, `--cover` (obligatorii); `--youtube`, `--tiktok`,
`--album-youtube`, `--new-album`, `--include-recent`, `--no-recent`,
`--dry-run`, `--no-push`, `--help`. Fără `--youtube`, piesa nu intră la
`Ultimele lansări`.

Regulile site-ului (imagini `.webp` lowercase fără spații sau diacritice,
cache-buster `?v=YYYYMMDDHHMM`, exact 10 piese la `Recent releases`, fără
Rumble pentru piese noi) sunt în `AGENTS.md`.

## RadioSIX

RadioSIX este playerul live de pe `https://ilielascu.de/radiosix`, instalabil
ca PWA.

- `radiosix.html` — pagina playerului;
- `manifest.json` — manifestul PWA (nume, culori, pictograma);
- `sw.js` — service worker (rețea mai întâi, cu fallback din cache offline);
- `assets/albums_database.json` — albumele și piesele cu ID-ul YouTube direct;
- `assets/songs_list.json` — lista pieselor;
- `assets/radiosix_logo.png`, `assets/radiosix_app_icon.png`,
  `assets/logo_radiosix_square.png` — sigla și pictogramele;
- `update_radiosix_db.py` — regenerează `albums_database.json` din folderul
  local de albume. Folosește doar ID-uri YouTube verificate manual
  (`VERIFIED_YOUTUBE_IDS`); piesele fără ID confirmat rămân nemapate;
- `test/radiosix.test.js` — verifică ID-urile YouTube (format valid și un
  singur titlu per video).

### radiosix-analytics

`radiosix-analytics/` este un Worker Cloudflare cu bază D1, pentru statistici
anonime despre ascultători. Stochează doar un ID aleator de sesiune, orele de
început și ultima activitate și timpul activ aproximat. Nu stochează IP, nume,
e-mail, URL-uri sau audio.

- `src/index.js` — Worker-ul (primește heartbeat-uri și servește raportul);
- `schema.sql` — schema D1;
- `wrangler.toml.example` — șablon de configurare. Copiază-l ca
  `wrangler.toml` și completează `database_id`; nu comite fișierul real;
- `ADMIN_TOKEN` se setează cu `npx wrangler secret put ADMIN_TOKEN`, nu în Git.

Pașii completi de instalare sunt în `radiosix-analytics/README.md`.

## Dezvoltare

```bash
npm install
npm test
npm run audit
npm run build:app
```

`node_modules/` și aplicația construită nu sunt versionate. Ele pot fi recreate
oricând din `package-lock.json` și sursele proiectului.
