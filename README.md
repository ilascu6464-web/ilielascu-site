# FlyDBX

FlyDBX este aplicația macOS folosită pentru publicarea muzicii noi pe
`https://ilielascu.de/`.

## Structură

- `index.html` — pagina publică și catalogul curent;
- `assets/` — numai imaginile folosite de site;
- `main.js`, `preload.js`, `renderer.js`, `form.html` — aplicația Electron;
- `site-editor.js` — regulile pentru albume și `Recent releases`;
- `test/` — teste pentru actualizarea catalogului;
- `scripts/audit_site.js` — verifică site-ul și imaginile;
- `scripts/build_app.sh` — reconstruiește `FlyDBX.app`.

## Utilizare

Deschide `FlyDBX.app`, alege coperta, titlul și albumul. Pentru o piesă care nu
trebuie afișată la `Ultimele lansări`, dezactivează opțiunea corespunzătoare.
Aplicația verifică Git, modifică numai `index.html` și coperta selectată, face
commit, push și verifică publicarea live.

## Dezvoltare

```bash
npm install
npm test
npm run audit
npm run build:app
```

`node_modules/` și aplicația construită nu sunt versionate. Ele pot fi recreate
oricând din `package-lock.json` și sursele proiectului.
