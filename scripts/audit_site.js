'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  findSectionByAriaLabel,
  listAlbumRows,
  listAlbums
} = require('../site-editor');

const projectDir = path.resolve(__dirname, '..');
const assetsDir = path.join(projectDir, 'assets');
const html = fs.readFileSync(path.join(projectDir, 'index.html'), 'utf8');
const errors = [];

const assetReferences = collectAssetReferences(html);
const assetFiles = fs.readdirSync(assetsDir)
  .filter(name => fs.statSync(path.join(assetsDir, name)).isFile())
  .sort();
const missing = [...assetReferences].filter(name => !assetFiles.includes(name));
const unused = assetFiles.filter(name => !assetReferences.has(name));

if (missing.length) errors.push(`Assets lipsă: ${missing.join(', ')}`);
if (unused.length) errors.push(`Assets nefolosite: ${unused.join(', ')}`);

const duplicateGroups = findDuplicateGroups(assetFiles);
if (duplicateGroups.length) {
  errors.push(
    `Fișiere identice: ${duplicateGroups.map(group => group.join(' = ')).join('; ')}`
  );
}

const recent = findSectionByAriaLabel(html, 'Recent releases');
const recentHtml = html.slice(recent.openEnd, recent.closeStart);
const recentTiles = (recentHtml.match(/<figure class="tile">/g) || []).length;
const recentYoutube = (recentHtml.match(/youtube\.com\/watch/g) || []).length;
const recentTikTok = (recentHtml.match(/tiktok\.com/g) || []).length;

if (recentTiles !== 10) errors.push(`Ultimele lansări conține ${recentTiles} piese.`);
if (recentYoutube !== recentTiles) errors.push('Nu toate lansările au link YouTube direct.');
if (recentTikTok !== recentTiles) errors.push('Nu toate lansările au link TikTok.');

const rows = listAlbumRows(html);
const latest = rows.filter(row => row.classes.includes('album-latest'));
const singles = rows.filter(row => row.classes.includes('album-singles-current'));

if (latest.length !== 1) errors.push(`Albume marcate latest: ${latest.length}.`);
if (singles.length !== 1 || singles[0].title !== 'Singles 2026') {
  errors.push('Marcajul pentru Singles 2026 nu este corect.');
}

const albumLinks = [...html.matchAll(/class="btn ytmusic" href="([^"]+)"/g)]
  .map(match => match[1].replace(/&amp;/g, '&'));
const invalidAlbumLinks = albumLinks.filter(link => (
  !link.startsWith('https://www.youtube.com/playlist?list=') ||
  !link.includes('&index=1') ||
  link.includes('watch?v=')
));

if (invalidAlbumLinks.length) {
  errors.push(`Linkuri YouTube album invalide: ${invalidAlbumLinks.length}.`);
}

const figures = [...html.matchAll(
  /<figure class="tile"><img alt="([^"]*)"[^>]*><figcaption>([\s\S]*?)<\/figcaption>/g
)];
const captionMismatches = figures.filter(match => match[1] !== stripTags(match[2]));
if (captionMismatches.length) {
  errors.push(`Alt/figcaption diferite: ${captionMismatches.length}.`);
}

if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log(`OK: ${assetFiles.length} assets, ${listAlbums(html).length} albume, 10 lansări recente.`);
}

function collectAssetReferences(source) {
  const references = new Set();

  for (const match of source.matchAll(/(?:src|data-src|href)="([^"]+)"/g)) {
    const value = match[1];
    const marker = value.startsWith('assets/')
      ? 'assets/'
      : value.includes('/assets/') ? '/assets/' : null;
    if (!marker) continue;

    const encoded = value
      .slice(value.indexOf(marker) + marker.length)
      .split('?')[0]
      .split('#')[0];
    references.add(safeDecode(encoded));
  }

  for (const match of source.matchAll(/url\(['"]?(assets\/[^)'"]+)/g)) {
    references.add(safeDecode(match[1].slice('assets/'.length).split('?')[0]));
  }

  return references;
}

function findDuplicateGroups(files) {
  const groups = new Map();

  for (const file of files) {
    const hash = crypto
      .createHash('sha256')
      .update(fs.readFileSync(path.join(assetsDir, file)))
      .digest('hex');
    if (!groups.has(hash)) groups.set(hash, []);
    groups.get(hash).push(file);
  }

  return [...groups.values()].filter(group => group.length > 1);
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function stripTags(value) {
  return value.replace(/<[^>]*>/g, '').trim();
}
