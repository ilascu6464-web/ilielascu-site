const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs   = require('fs');
const { execSync, exec } = require('child_process');

// Calea către site (folderul FlayDBX cu index.html și assets)
const SITE_DIR   = '/Users/ilascu/L_DATA_MAC/PROGRAMARE/FlyDBX';
const ASSETS_DIR = path.join(SITE_DIR, 'assets');
const INDEX_HTML = path.join(SITE_DIR, 'index.html');
const LINKS_JS   = path.join(SITE_DIR, 'assets', 'links.js');

let win;

app.whenReady().then(() => {
  win = new BrowserWindow({
    width: 600,
    height: 780,
    resizable: false,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0c0f14',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile('index.html');
});

app.on('window-all-closed', () => app.quit());

// ── IPC: deschide dialog pentru cover ──────────────────────
ipcMain.handle('pick-cover', async () => {
  const result = await dialog.showOpenDialog(win, {
    title: 'Alege cover art',
    filters: [{ name: 'Imagini', extensions: ['png','jpg','jpeg','webp'] }],
    properties: ['openFile']
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

// ── IPC: FLY — procesează și publică piesa ─────────────────
ipcMain.handle('fly', async (event, data) => {
  try {
    const { title, album, albumColor, tiktok, coverPath, isNewAlbum, ytlink, rumblelink } = data;

    // 1. Convertim cover → WebP și copiem în assets/
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const webpName = slug + '.webp';
    const webpDest = path.join(ASSETS_DIR, webpName);

    if (coverPath) {
      // Conversie cu cwebp (instalat via brew)
      try {
        execSync(`cwebp -q 85 "${coverPath}" -o "${webpDest}"`, { stdio: 'pipe' });
      } catch {
        // Dacă cwebp nu merge, copiem direct (dacă e deja webp)
        fs.copyFileSync(coverPath, webpDest);
      }
    }

    // 2. Actualizăm links.js (adăugăm TikTok)
    if (tiktok) {
      let linksContent = fs.readFileSync(LINKS_JS, 'utf8');
      // Găsim locul după primul { și inserăm
      const insertAfter = 'var tiktokLinks = {';
      const newEntry = `\n    "${title}": "${tiktok}",`;
      linksContent = linksContent.replace(insertAfter, insertAfter + newEntry);
      fs.writeFileSync(LINKS_JS, linksContent, 'utf8');
    }

    // 3. Actualizăm index.html
    updateIndexHTML({ title, album, albumColor, webpName, slug, ytlink, rumblelink, isNewAlbum });

    // 4. Git commit
    const gitCmd = `cd "${SITE_DIR}" && git add -A && git commit -m "FlyDBX Auto: ${title}"`;
    execSync(gitCmd, { stdio: 'pipe' });

    return { ok: true, message: `✅ "${title}" adăugat! Mergi pe GitHub și apasă Push.` };
  } catch (err) {
    return { ok: false, message: `❌ Eroare: ${err.message}` };
  }
});

// ── Funcție: actualizare index.html ───────────────────────
function updateIndexHTML({ title, album, albumColor, webpName, slug, ytlink, rumblelink, isNewAlbum }) {
  let html = fs.readFileSync(INDEX_HTML, 'utf8');

  // Noul tile pentru galerie
  const tile = `
        <figure class="tile"><img alt="${title}" loading="lazy" src="assets/${webpName}"><figcaption>${title}</figcaption></figure>`;

  if (isNewAlbum) {
    // Creăm un nou media-row înainte de </section> (secțiunea muzică)
    const newRow = `
<div class="media-row ${slug}">
<img alt="${title}" class="thumb" src="assets/${webpName}">
<div class="media-content">
<h3>${album}</h3>
<div></div>
<div class="en"></div>
<div class="btns">
    <a class="btn ytmusic" href="${ytlink || '#'}" rel="noopener" target="_blank">🎧 YouTube Music</a>
    <a class="btn rumble" href="${rumblelink || '#'}" rel="noopener" target="_blank">▶️ Rumble Music</a>
</div>
<div class="gallery">${tile}
</div>
</div>
</div>
`;
    // Inserăm înaintea tag-ului </section> din secțiunea Music
    html = html.replace('</section>\n</main>', newRow + '</section>\n</main>');
  } else {
    // Adăugăm tile în galeria albumului existent
    // Căutăm <h3>NumeAlbum</h3> și apoi primul </div> care închide gallery
    const albumMarker = `<h3>${album}</h3>`;
    if (html.includes(albumMarker)) {
      const albumIdx = html.indexOf(albumMarker);
      // Găsim tag-ul </div> care închide div.gallery (după ultima figcaption din album)
      const galleryOpen = html.indexOf('<div class="gallery">', albumIdx);
      if (galleryOpen !== -1) {
        const galleryClose = html.indexOf('</div>', galleryOpen);
        if (galleryClose !== -1) {
          html = html.slice(0, galleryClose) + tile + '\n        ' + html.slice(galleryClose);
        }
      }
    }
  }

  fs.writeFileSync(INDEX_HTML, html, 'utf8');
}
