# Procedura sigură pentru ilielascu.de

Acest proiect publică `https://ilielascu.de/`. Pagina live și `index.html`
de pe branch-ul `main` sunt sursa de adevăr.

## Reguli fixe

1. Începe cu:
   ```bash
   git status --short --branch
   ```
2. Nu modifica și nu publica fișiere fără legătură cu cererea curentă.
3. Nu folosi `git add -A`. Adaugă explicit numai `index.html` și imaginile noi.
4. Imaginile noi trebuie să fie `.webp`, lowercase și fără spații în nume.
5. În galerii folosește `data-src` și cache-buster:
   ```html
   assets/nume.webp?v=YYYYMMDDHHMM
   ```
6. Nu adăuga Rumble pentru albume sau piese noi.
7. Păstrează conținutul și linkurile vechi dacă utilizatorul nu cere schimbarea lor.

## Piesă nouă

1. Confirmă că imaginea există în `assets/`.
2. Găsește albumul după `<h3>Numele albumului</h3>`.
3. Adaugă piesa la finalul galeriei albumului:
   ```html
   <figure class="tile"><img alt="TITLU" loading="lazy" data-src="assets/nume.webp?v=YYYYMMDDHHMM"><figcaption>TITLU</figcaption></figure>
   ```
4. Implicit, adaugă piesa și la finalul `Recent releases`, exceptând cazul în
   care utilizatorul spune explicit să rămână numai în album.
5. `Recent releases` conține exact 10 piese, în ordine cronologică de la stânga
   la dreapta. La o piesă nouă elimină prima piesă din stânga.
6. În `Recent releases`, YouTube trebuie să fie linkul direct:
   `https://www.youtube.com/watch?v=VIDEO_ID&list=PLAYLIST_ID`, fără `index`.
7. Pentru TikTok folosește linkul direct al piesei când este cunoscut; altfel
   folosește `https://www.tiktok.com/@ilascu99`.
8. Nu adăuga linkuri individuale sub piesele din galeria albumului.

## Album nou

1. Albumul nou primește clasa `album-latest`; elimină această clasă de pe
   albumul precedent.
2. `Singles 2026` păstrează clasa `album-singles-current`.
3. Ordinea vizuală este: albumul cel mai nou, `Singles 2026`, apoi albumele
   precedente în ordinea apariției.
4. Linkul YouTube al albumului trebuie normalizat la:
   `https://www.youtube.com/playlist?list=PLAYLIST_ID&index=1`.
5. Pentru album nou nu adăuga descriere, copertă separată sau buton Rumble.
   JavaScript-ul paginii adaugă automat butonul TikTok universal.

## Verificare

Rulează:

```bash
npm test
npm run audit
git diff --check
```

Confirmă că:

- titlul apare o singură dată în album;
- imaginea există;
- `Recent releases` are exact 10 piese;
- există un singur `album-latest`;
- ordinea albumelor este corectă;
- linkurile cerute sunt corecte.

## Publicare

```bash
git add index.html assets/nume.webp
git commit -m "Add TITLU"
git push origin main
```

După publicare, verifică imaginea și pagina live cu un query de cache:

```bash
curl -L -s -o /dev/null -w '%{http_code} %{content_type}' \
  'https://ilielascu.de/assets/nume.webp?v=probeTIMESTAMP'
curl -L -s 'https://ilielascu.de/?v=verifyTIMESTAMP'
```

Imaginea trebuie să răspundă `200 image/webp`.
