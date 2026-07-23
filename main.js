'use strict';

const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  cacheVersion,
  listAlbums,
  slugify,
  updateSiteHtml
} = require('./site-editor');

const EXPECTED_BRANCH = 'main';
const DEFAULT_SITE_DIR = '/Users/ilascu/L_DATA_MAC/PROGRAMARE/FlyDBX';
const SAFE_WEBP_NAME = /^[a-z0-9][a-z0-9._-]*\.webp$/;
const GIT_EXECUTABLE = '/usr/bin/git';
const TOOL_PATH = [
  '/Applications/Xcode.app/Contents/Developer/usr/libexec/git-core',
  '/Library/Developer/CommandLineTools/usr/libexec/git-core',
  '/opt/homebrew/bin',
  '/usr/local/bin',
  process.env.PATH
].filter(Boolean).join(':');

let mainWindow;
let siteDir;

app.whenReady().then(async () => {
  siteDir = await resolveSiteDir();
  mainWindow = createWindow();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function createWindow() {
  const window = new BrowserWindow({
    width: 720,
    height: 820,
    minWidth: 640,
    minHeight: 720,
    title: 'FlyDBX',
    backgroundColor: '#0b0c0b',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', event => event.preventDefault());
  window.loadFile('form.html');
  return window;
}

ipcMain.handle('get-site-state', async () => {
  const resolved = await ensureSiteDir();
  const html = fs.readFileSync(path.join(resolved, 'index.html'), 'utf8');
  return {
    albums: listAlbums(html),
    siteDir: resolved
  };
});

ipcMain.handle('pick-cover', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Alege coperta piesei',
    filters: [{ name: 'Imagini', extensions: ['webp', 'png', 'jpg', 'jpeg'] }],
    properties: ['openFile']
  });

  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('publish-track', async (_event, payload) => {
  let originalHtml = null;
  let assetDestination = null;
  let assetRelativePath = null;
  let assetCreatedByApp = false;
  let committed = false;

  try {
    const resolved = await ensureSiteDir();
    const data = normalizePayload(payload);
    const asset = resolveAssetPlan(resolved, data.coverPath, data.title);
    const allowedDirtyPath = asset.alreadyInAssets ? asset.relativePath : null;

    assertRepositoryReady(resolved, allowedDirtyPath);
    syncRepository(resolved);
    assertRepositoryReady(resolved, allowedDirtyPath);

    const indexPath = path.join(resolved, 'index.html');
    originalHtml = fs.readFileSync(indexPath, 'utf8');
    const version = cacheVersion();
    const updatedHtml = updateSiteHtml(originalHtml, {
      ...data,
      assetName: asset.assetName,
      version
    });

    assetDestination = path.join(resolved, asset.relativePath);
    assetRelativePath = asset.relativePath;
    if (!asset.alreadyInAssets && fs.existsSync(assetDestination)) {
      throw new Error(`Fișierul ${asset.relativePath} există deja.`);
    }

    if (!asset.alreadyInAssets) {
      createWebpAsset(data.coverPath, assetDestination);
      assetCreatedByApp = true;
    }

    writeFileAtomically(indexPath, updatedHtml);
    stageAndValidate(resolved, asset.relativePath);
    git(resolved, 'commit', '-m', `Add ${data.title}`);
    committed = true;

    try {
      git(resolved, 'push', 'origin', EXPECTED_BRANCH);
    } catch (error) {
      return {
        ok: false,
        message: `Modificarea este salvată local, dar push-ul a eșuat: ${cleanGitError(error)}`
      };
    }

    const live = await waitForLive({
      title: data.title,
      assetName: asset.assetName,
      version
    });

    return {
      ok: true,
      message: live
        ? `"${data.title}" este publicată și verificată live.`
        : `"${data.title}" este publicată pe GitHub. Site-ul încă procesează actualizarea.`
    };
  } catch (error) {
    if (!committed && originalHtml !== null) {
      rollbackUncommittedChanges({
        originalHtml,
        siteDir,
        assetDestination,
        assetRelativePath,
        assetCreatedByApp
      });
    }

    return { ok: false, message: error.message };
  }
});

function normalizePayload(payload) {
  const data = {
    title: String(payload?.title || '').trim(),
    album: String(payload?.album || '').trim(),
    coverPath: String(payload?.coverPath || '').trim(),
    isNewAlbum: Boolean(payload?.isNewAlbum),
    includeRecent: Boolean(payload?.includeRecent),
    albumYoutubeUrl: String(payload?.albumYoutubeUrl || '').trim(),
    youtubeUrl: String(payload?.youtubeUrl || '').trim(),
    tiktokUrl: String(payload?.tiktokUrl || '').trim()
  };

  if (!data.title) throw new Error('Titlul piesei este obligatoriu.');
  if (!data.album) throw new Error('Albumul este obligatoriu.');
  if (!data.coverPath || !fs.existsSync(data.coverPath)) {
    throw new Error('Coperta selectată nu există.');
  }
  if (data.isNewAlbum && !data.albumYoutubeUrl) {
    throw new Error('Linkul YouTube al albumului nou este obligatoriu.');
  }
  if (data.includeRecent && !data.youtubeUrl) {
    throw new Error('Linkul YouTube direct este obligatoriu pentru Ultimele lansări.');
  }

  return data;
}

function resolveAssetPlan(resolvedSiteDir, coverPath, title) {
  const source = path.resolve(coverPath);
  const assetsDir = path.join(resolvedSiteDir, 'assets');
  const sourceDirectory = path.dirname(source);
  const sourceExtension = path.extname(source).toLowerCase();
  const alreadyInAssets = sourceDirectory === assetsDir;

  let assetName;
  if (alreadyInAssets) {
    assetName = path.basename(source);
    if (!SAFE_WEBP_NAME.test(assetName)) {
      throw new Error('În assets, coperta trebuie să fie .webp, lowercase și fără spații.');
    }
  } else if (sourceExtension === '.webp' && SAFE_WEBP_NAME.test(path.basename(source))) {
    assetName = path.basename(source);
  } else {
    assetName = `${slugify(title)}.webp`;
  }

  return {
    assetName,
    alreadyInAssets,
    relativePath: path.posix.join('assets', assetName)
  };
}

function assertRepositoryReady(resolvedSiteDir, allowedDirtyPath) {
  const branch = git(resolvedSiteDir, 'rev-parse', '--abbrev-ref', 'HEAD').trim();
  if (branch !== EXPECTED_BRANCH) {
    throw new Error(`FlyDBX publică doar din branch-ul ${EXPECTED_BRANCH}.`);
  }

  const status = git(
    resolvedSiteDir,
    'status',
    '--porcelain',
    '-z',
    '--untracked-files=all'
  );
  const entries = status.split('\0').filter(Boolean);
  const unexpected = entries.filter(entry => {
    const code = entry.slice(0, 2);
    const file = entry.slice(3);
    return !(allowedDirtyPath && code === '??' && file === allowedDirtyPath);
  });

  if (unexpected.length) {
    throw new Error('Folderul are modificări nepublicate. Rezolvă-le înainte de a folosi FlyDBX.');
  }
}

function syncRepository(resolvedSiteDir) {
  git(resolvedSiteDir, 'pull', '--ff-only', 'origin', EXPECTED_BRANCH);
}

function createWebpAsset(sourcePath, destinationPath) {
  const temporaryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flydbx-cover-'));
  const temporaryAsset = path.join(temporaryDir, path.basename(destinationPath));

  try {
    if (path.extname(sourcePath).toLowerCase() === '.webp') {
      fs.copyFileSync(sourcePath, temporaryAsset);
    } else {
      const cwebp = findExecutable([
        '/opt/homebrew/bin/cwebp',
        '/usr/local/bin/cwebp'
      ]);
      if (!cwebp) {
        throw new Error('Conversia în WebP necesită cwebp instalat.');
      }

      try {
        execFileSync(
          cwebp,
          ['-quiet', '-q', '88', sourcePath, '-o', temporaryAsset],
          { env: { ...process.env, PATH: TOOL_PATH }, stdio: 'pipe' }
        );
      } catch {
        throw new Error('Conversia în WebP a eșuat. Verifică imaginea selectată.');
      }
    }

    fs.copyFileSync(temporaryAsset, destinationPath);
  } finally {
    fs.rmSync(temporaryDir, { recursive: true, force: true });
  }
}

function writeFileAtomically(destination, content) {
  const temporary = `${destination}.flydbx-tmp`;
  fs.writeFileSync(temporary, content, 'utf8');
  fs.renameSync(temporary, destination);
}

function stageAndValidate(resolvedSiteDir, assetRelativePath) {
  git(resolvedSiteDir, 'add', '--', 'index.html', assetRelativePath);
  git(resolvedSiteDir, 'diff', '--cached', '--check');

  const staged = git(
    resolvedSiteDir,
    'diff',
    '--cached',
    '--name-only'
  ).trim().split('\n').filter(Boolean).sort();
  const expected = ['index.html', assetRelativePath].sort();

  if (JSON.stringify(staged) !== JSON.stringify(expected)) {
    throw new Error('Verificarea fișierelor pregătite pentru publicare a eșuat.');
  }
}

function rollbackUncommittedChanges({
  originalHtml,
  siteDir: resolvedSiteDir,
  assetDestination,
  assetRelativePath,
  assetCreatedByApp
}) {
  try {
    fs.writeFileSync(path.join(resolvedSiteDir, 'index.html'), originalHtml, 'utf8');
    if (assetCreatedByApp && assetDestination && fs.existsSync(assetDestination)) {
      fs.unlinkSync(assetDestination);
    }
    const stagedPaths = ['index.html', assetRelativePath].filter(Boolean);
    spawnSync(
      GIT_EXECUTABLE,
      ['restore', '--staged', '--', ...stagedPaths],
      {
        cwd: resolvedSiteDir,
        env: { ...process.env, PATH: TOOL_PATH },
        stdio: 'ignore'
      }
    );
  } catch {
    // Keep the original error; the repository remains recoverable through Git.
  }
}

async function waitForLive({ title, assetName, version }) {
  const expectedAsset = `assets/${assetName}?v=${version}`;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      const stamp = Date.now();
      const pageResponse = await fetch(`https://ilielascu.de/?v=flydbx-${stamp}`);
      const page = await pageResponse.text();
      const assetResponse = await fetch(
        `https://ilielascu.de/assets/${encodeURIComponent(assetName)}?v=flydbx-${stamp}`
      );

      if (
        pageResponse.ok &&
        page.includes(title) &&
        page.includes(expectedAsset) &&
        assetResponse.ok &&
        (assetResponse.headers.get('content-type') || '').startsWith('image/webp')
      ) {
        return true;
      }
    } catch {
      // Deployment may still be propagating.
    }

    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  return false;
}

async function resolveSiteDir() {
  const candidates = [
    process.env.FLYDBX_SITE_DIR,
    app.isPackaged ? path.resolve(app.getAppPath(), '../../../..') : __dirname,
    DEFAULT_SITE_DIR
  ].filter(Boolean);

  const match = candidates.find(isValidSiteDir);
  if (match) return path.resolve(match);

  const result = await dialog.showOpenDialog({
    title: 'Alege folderul FlyDBX',
    properties: ['openDirectory']
  });

  if (result.canceled || !isValidSiteDir(result.filePaths[0])) {
    throw new Error('Folderul FlyDBX nu a fost găsit.');
  }

  return path.resolve(result.filePaths[0]);
}

async function ensureSiteDir() {
  if (siteDir && isValidSiteDir(siteDir)) return siteDir;
  siteDir = await resolveSiteDir();
  return siteDir;
}

function isValidSiteDir(candidate) {
  if (!candidate) return false;
  return fs.existsSync(path.join(candidate, 'index.html')) &&
    fs.existsSync(path.join(candidate, 'assets')) &&
    fs.existsSync(path.join(candidate, '.git'));
}

function git(resolvedSiteDir, ...args) {
  try {
    return execFileSync(GIT_EXECUTABLE, args, {
      cwd: resolvedSiteDir,
      encoding: 'utf8',
      env: { ...process.env, PATH: TOOL_PATH },
      stdio: ['ignore', 'pipe', 'pipe']
    });
  } catch (error) {
    throw new Error(cleanGitError(error));
  }
}

function cleanGitError(error) {
  const stderr = String(error?.stderr || '').trim();
  return stderr || error?.message || 'Comanda Git a eșuat.';
}

function findExecutable(candidates) {
  return candidates.find(candidate => fs.existsSync(candidate)) || null;
}
