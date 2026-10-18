# RadioSIX analytics privat

Backend minimal pentru statistici anonime RadioSIX LIVE.

## Ce stochează

Doar un ID aleator de sesiune, orele de început/ultima activitate și timpul activ aproximat. Nu stochează IP, nume, e-mail, URL-uri sau audio.

## Instalare Cloudflare

1. Creează un D1 database numit `radiosix-analytics`.
2. Copiază `wrangler.toml.example` în `wrangler.toml` și completează `database_id`.
3. Rulează schema:

```bash
npx wrangler d1 execute radiosix-analytics --remote --file=schema.sql
```

4. Setează tokenul privat, fără să-l scrii în Git:

```bash
npx wrangler secret put ADMIN_TOKEN
```

5. Publică Worker-ul:

```bash
npx wrangler deploy
```

6. Configurează ruta Cloudflare `ilielascu.de/api/radiosix/*` către Worker sau folosește URL-ul Worker-ului până când ruta este configurată.

Indicatorul public „Now” rămâne dezactivat în prima fază.
