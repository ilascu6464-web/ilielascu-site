const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFileSync, spawnSync } = require('child_process');

// Calea către site (folderul FlyDBX cu index.html și assets)
const SITE_DIR = __dirname;
const ASSETS_DIR = path.join(SITE_DIR, 'assets');
const INDEX_HTML = path.join(SITE_DIR, 'index.html');
const LINKS_JS = path.join(SITE_DIR, 'assets', 'links.js');

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
  win.loadFile('form.html');
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
    const { title, album, tiktok, coverPath, isNewAlbum, ytlink, rumblelink } = data;
    const safeTitle = String(title || '').trim();
    const safeAlbum = String(album || '').trim();
    const safeTikTok = String(tiktok || '').trim();
    const safeYtLink = String(ytlink || '').trim();
    const safeRumbleLink = String(rumblelink || '').trim();

    if (!safeTitle) {
      throw new Error('Titlul piesei este obligatoriu.');
    }

    if (!safeAlbum) {
      throw new Error('Albumul este obligatoriu.');
    }

    if (!coverPath) {
      throw new Error('Cover-ul este obligatoriu.');
    }

    // 1. Aducem ultimul conținut înainte de modificări locale.
    git('pull', '--rebase', '--autostash', 'origin', 'main');

    // 2. Convertim cover-ul și îl copiem în assets/.
    const slug = slugify(safeTitle);
    const assetName = prepareCoverAsset(coverPath, slug);

    // 3. Actualizăm links.js (adăugăm TikTok).
    if (safeTikTok) {
      updateTikTokLinks(safeTitle, safeTikTok);
    }

    // 4. Actualizăm index.html.
    updateIndexHTML({
      title: safeTitle,
      album: safeAlbum,
      assetName,
      slug,
      ytlink: safeYtLink,
      rumblelink: safeRumbleLink,
      isNewAlbum
    });

    // 5. Git add + commit.
    git('add', '-A');

    if (hasStagedChanges()) {
      git('commit', '-m', `FlyDBX Auto: ${safeTitle}`);
    }

    return { ok: true, message: `✅ "${safeTitle}" adăugat! Poți face push din aplicație.` };
  } catch (err) {
    return { ok: false, message: `❌ Eroare: ${err.message}` };
  }
});

// ── Funcție: actualizare index.html ───────────────────────
function updateIndexHTML({ title, album, assetName, slug, ytlink, rumblelink, isNewAlbum }) {
  let html = fs.readFileSync(INDEX_HTML, 'utf8');
  const titleHtml = escapeHtml(title);
  const albumHtml = escapeHtml(album);
  const assetPath = `assets/${assetName}`;
  const safeYtLink = escapeHtml(ytlink || '#');
  const safeRumbleLink = escapeHtml(rumblelink || '#');

  // Noul tile pentru galerie
  const tile = `
        <figure class="tile"><img alt="${titleHtml}" loading="lazy" src="${assetPath}"><figcaption>${titleHtml}</figcaption></figure>`;

  if (isNewAlbum) {
    // Creăm un nou media-row la finalul secțiunii de muzică.
    const newRow = `
<div class="media-row ${slug}">
<img alt="${titleHtml}" class="thumb" src="${assetPath}">
<div class="media-content">
<h3>${albumHtml}</h3>
<div></div>
<div class="en"></div>
<div class="btns">
    <a class="btn ytmusic" href="${safeYtLink}" rel="noopener" target="_blank">🎧 YouTube Music</a>
    <a class="btn rumble" href="${safeRumbleLink}" rel="noopener" target="_blank">▶️ Rumble Music</a>
</div>
<div class="gallery">${tile}
</div>
</div>
</div>
`;
    const musicStart = html.indexOf('<section aria-label="Music" class="wrapper">');
    if (musicStart === -1) {
      throw new Error('Secțiunea Music nu a fost găsită în index.html.');
    }

    const musicEnd = html.indexOf('</section>', musicStart);
    if (musicEnd === -1) {
      throw new Error('Închiderea secțiunii Music nu a fost găsită în index.html.');
    }

    html = html.slice(0, musicEnd) + newRow + html.slice(musicEnd);
  } else {
    // Adăugăm tile în galeria albumului existent.
    const albumMarker = `<h3>${albumHtml}</h3>`;
    if (html.includes(albumMarker)) {
      const albumIdx = html.indexOf(albumMarker);
      const galleryOpen = html.indexOf('<div class="gallery">', albumIdx);
      if (galleryOpen !== -1) {
        const galleryClose = html.indexOf('</div>', galleryOpen);
        if (galleryClose !== -1) {
          html = html.slice(0, galleryClose) + tile + '\n        ' + html.slice(galleryClose);
        } else {
          throw new Error(`Galeria albumului "${album}" nu a putut fi actualizată.`);
        }
      } else {
        throw new Error(`Albumul "${album}" nu are galerie în index.html.`);
      }
    } else {
      throw new Error(`Albumul "${album}" nu există în index.html.`);
    }
  }

  html = refreshLinksScriptCacheBuster(html);
  fs.writeFileSync(INDEX_HTML, html, 'utf8');
}

ipcMain.handle('push-github', async () => {
  try {
    const branch = git('rev-parse', '--abbrev-ref', 'HEAD').trim();
    git('push', 'origin', branch);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

function slugify(value) {
  const slug = String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return slug || `track-${Date.now()}`;
}

function prepareCoverAsset(coverPath, slug) {
  const sourceExt = path.extname(coverPath).toLowerCase();
  const directCopyAllowed = sourceExt === '.webp';
  const webpName = `${slug}.webp`;
  const webpDest = path.join(ASSETS_DIR, webpName);

  try {
    execFileSync('cwebp', ['-q', '85', coverPath, '-o', webpDest], { stdio: 'pipe' });
    return webpName;
  } catch (error) {
    if (!directCopyAllowed) {
      throw new Error('Conversia cover-ului a eșuat. Instalează `cwebp` sau folosește un fișier .webp.');
    }

    fs.copyFileSync(coverPath, webpDest);
    return webpName;
  }
}

function updateTikTokLinks(title, tiktokUrl) {
  let linksContent = fs.readFileSync(LINKS_JS, 'utf8');
  const entryLine = `    ${JSON.stringify(title)}: ${JSON.stringify(tiktokUrl)},`;
  const existingEntryRegex = new RegExp(`^\\s*${escapeRegExp(JSON.stringify(title))}:\\s*.*,$`, 'm');

  if (existingEntryRegex.test(linksContent)) {
    linksContent = linksContent.replace(existingEntryRegex, entryLine);
  } else {
    const marker = '// --- NEW SINGLES ---';
    if (linksContent.includes(marker)) {
      linksContent = linksContent.replace(marker, `${marker}\n${entryLine}`);
    } else {
      const insertAfter = 'var tiktokLinks = {';
      if (!linksContent.includes(insertAfter)) {
        throw new Error('Structura assets/links.js nu este recunoscută.');
      }

      linksContent = linksContent.replace(insertAfter, `${insertAfter}\n    // --- NEW SINGLES ---\n${entryLine}`);
    }
  }

  fs.writeFileSync(LINKS_JS, linksContent, 'utf8');
}

function git(...args) {
  return execFileSync('git', args, {
    cwd: SITE_DIR,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

function hasStagedChanges() {
  const result = spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: SITE_DIR });
  return result.status === 1;
}

function refreshLinksScriptCacheBuster(html) {
  const version = Date.now();
  const scriptPattern = /<script src="assets\/links\.js(?:\?v=\d+)?"><\/script>/;

  if (!scriptPattern.test(html)) {
    throw new Error('Scriptul assets/links.js nu a fost găsit în index.html.');
  }

  return html.replace(scriptPattern, `<script src="assets/links.js?v=${version}"></script>`);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
