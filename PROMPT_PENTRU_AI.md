# Prompt pentru orice AI — Adaugă piesă nouă pe ilielascu.de

Copiază textul de mai jos și dă-l AI-ului, completând datele piesei:

---

## PROMPT (copiază de aici)

Am un site muzical la adresa ilielascu.de.
Trebuie să adaugi o piesă nouă în fișierul:
`/Users/ilascu/L_DATA_MAC/PROGRAMARE/FlyDBX/index.html`

**Date piesă nouă:**
- Titlu: `TITLUL PIESEI` ← înlocuiește cu titlul exact
- Cover: `assets/numefisier.webp` ← înlocuiește cu numele fișierului din assets/
- TikTok link: `https://www.tiktok.com/@ilascu99/video/XXXXXXXXXXXXXXXXX` ← link-ul tău

**Modificare 1 — Adaugă tile în galeria Singles 2026:**

În index.html, găsește secțiunea cu `<h3>Singles 2026</h3>`.
Găsește ultimul `<figure class="tile">` din acea secțiune și adaugă după el:

```html
<figure class="tile"><img alt="TITLUL PIESEI" loading="lazy" src="assets/numefisier.webp"><figcaption>TITLUL PIESEI</figcaption></figure>
```

**Modificare 2 — Adaugă TikTok link în scriptul inline:**

În același index.html, găsește blocul `<script>` din `<head>` care conține `var tiktokLinks = {`.
Găsește linia `"The Guardian of the Code":` și adaugă ÎNAINTE de ea:

```javascript
    "TITLUL PIESEI": "https://www.tiktok.com/@ilascu99/video/XXXXXXXXXXXXXXXXX",
```

**Modificare 3 — Adaugă și în links.js (backup):**

Deschide `/Users/ilascu/L_DATA_MAC/PROGRAMARE/FlyDBX/assets/links.js`.
Găsește linia `"The Guardian of the Code":` și adaugă ÎNAINTE de ea:

```javascript
    "TITLUL PIESEI": "https://www.tiktok.com/@ilascu99/video/XXXXXXXXXXXXXXXXX",
```

**După modificări, rulează în Terminal:**
```bash
cd /Users/ilascu/L_DATA_MAC/PROGRAMARE/FlyDBX
git add -A
git commit -m "Adaugat: TITLUL PIESEI"
git push
```

**Reguli importante:**
- Textul din `figcaption` trebuie să fie identic cu cheia din `tiktokLinks` (majuscule/minuscule contează)
- Nu modifica altceva în fișier
- Nu șterge nicio piesă existentă
- Validează că HTML-ul rămâne corect după modificare
