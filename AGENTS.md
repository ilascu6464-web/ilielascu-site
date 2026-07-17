# Procedura rapida si sigura pentru ilielascu.de

Acest proiect publica site-ul `https://ilielascu.de/`.

## Principiu

Lucreaza rapid, dar controlat: modifica exact ce a cerut utilizatorul, verifica esentialul, publica, apoi verifica live. Nu face verificari lungi sau repetate daca semnalele principale sunt bune.

## Reguli fixe

1. Incepe cu:
   ```bash
   git status --short --branch
   ```
2. Nu atinge fisiere nelegate de cererea curenta.
3. Daca apare `internal/` ca neversionat, lasa-l neatins.
4. Nu folosi `git add -A`.
5. Adauga explicit doar fisierele necesare:
   ```bash
   git add index.html assets/nume.webp
   ```
6. Pentru imagini noi din `assets/`, pune cache-buster in `index.html`:
   ```html
   assets/nume.webp?v=YYYYMMDDHHMM
   ```
7. Fiecare link YouTube Music al unui album trebuie sa foloseasca formatul `https://www.youtube.com/playlist?list=...&index=1`, fara `watch?v=...`, pentru a deschide mereu prima piesa din playlist.

## Piesa noua

1. Confirma ca imaginea `.webp` exista in `assets/`.
2. Gaseste albumul dupa `<h3>Numele Albumului</h3>`.
3. Adauga tile-ul in galeria albumului:
   ```html
   <figure class="tile"><img alt="TITLUL PIESEI" loading="lazy" src="assets/nume.webp?v=YYYYMMDDHHMM"><figcaption>TITLUL PIESEI</figcaption></figure>
   ```
4. Adauga acelasi tile la finalul galeriei `Recent releases`, cu un link YouTube direct catre piesa respectiva, in formatul `https://www.youtube.com/watch?v=VIDEO_ID&list=PLAYLIST_ID&index=POZITIE`, plus linkul TikTok. Nu adauga Rumble la lansarile recente. Pastreaza exact 10 piese: cand o piesa noua este adaugata in dreapta, elimina prima piesa din stanga. Ordinea este cronologica de la stanga la dreapta.
5. Nu adauga link TikTok separat pentru fiecare piesa. Se foloseste linkul universal `https://www.tiktok.com/@ilascu99`.

## Album nou sau schimbare de ordine

1. Adauga blocul `media-row` in sectiunea `Music`.
2. Daca utilizatorul cere ordinea albumelor, muta blocurile HTML in ordinea ceruta.
3. Verifica doar lista de titluri din sectiunea `Music`, nu toata pagina.

## Verificare scurta inainte de publicare

Verifica:

- titlul apare o singura data unde trebuie;
- imaginea exista;
- linkurile cerute sunt corecte;
- ordinea albumelor este corecta, daca s-a cerut.

## Publicare

```bash
git add index.html assets/nume.webp
git commit -m "Add TITLUL"
git push origin main
```

Daca `git push` nu gaseste helperul de credentiale pe macOS, foloseste:

```bash
PATH="/Applications/Xcode.app/Contents/Developer/usr/libexec/git-core:/Library/Developer/CommandLineTools/usr/libexec/git-core:$PATH" git push origin main
```

## Verificare live

Pentru imagini noi, verifica intai cu un query de proba:

```bash
curl -L -s -o /dev/null -w '%{http_code} %{content_type}' 'https://ilielascu.de/assets/nume.webp?v=probeTIMESTAMP'
```

Este bine cand raspunde `200 image/webp`. Daca raspunde `text/html`, asteapta scurt si reincearca.

Apoi verifica pagina live cu:

```bash
curl -L -s 'https://ilielascu.de/?v=verifyTIMESTAMP'
```

Confirma doar lucrurile esentiale: titlu, fisierul `.webp?v=...`, linkuri si ordinea ceruta.

Important: cand trimiti HTML catre Python, foloseste `python3 -c`. Nu folosi combinatia `curl ... | python3 - <<'PY'`, pentru ca HTML-ul poate fi interpretat gresit ca script.
