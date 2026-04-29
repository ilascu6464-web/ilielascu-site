# Prompt pentru orice AI — Adaugă piesă nouă pe ilielascu.de

Copiază textul de mai jos și dă-l AI-ului, completând datele piesei:

---

## PROMPT (copiază de aici)

Am un site muzical la adresa ilielascu.de.
Trebuie să adaugi o piesă nouă în fișierul:
`/Users/ilascu/L_DATA_MAC/PROGRAMARE/FlyDBX/index.html`

**Date piesă nouă:**
- Titlu: `TITLUL PIESEI`
- Cover: `assets/numefisier.webp`

**Modificare 1 — Adaugă tile în galeria Singles 2026:**

În `index.html`, găsește secțiunea cu `<h3>Singles 2026</h3>`.
Găsește ultimul `<figure class="tile">` din acea secțiune și adaugă după el:

```html
<figure class="tile"><img alt="TITLUL PIESEI" loading="lazy" src="assets/numefisier.webp"><figcaption>TITLUL PIESEI</figcaption></figure>
```

**Modificare 2 — NU adăuga link TikTok per piesă:**

Site-ul folosește doar link universal de profil TikTok (`https://www.tiktok.com/@ilascu99`), fără link separat pentru fiecare piesă.

**După modificări, rulează în Terminal:**
```bash
cd /Users/ilascu/L_DATA_MAC/PROGRAMARE/FlyDBX
git add -A
git commit -m "Adaugat: TITLUL PIESEI"
git push
```

**Reguli importante:**
- Nu modifica altceva în fișier
- Nu șterge nicio piesă existentă
- Validează că HTML-ul rămâne corect după modificare
