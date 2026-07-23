'use strict';

const PROFILE_TIKTOK_URL = 'https://www.tiktok.com/@ilascu99';
const CURRENT_SINGLES_ALBUM = 'Singles 2026';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function decodeHtml(value) {
  return String(value)
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
}

function textContent(value) {
  return decodeHtml(String(value).replace(/<[^>]*>/g, '')).trim();
}

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

function cacheVersion(date = new Date()) {
  const parts = [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes()
  ];

  return parts
    .map((part, index) => String(part).padStart(index === 0 ? 4 : 2, '0'))
    .join('');
}

function getClassNames(openTag) {
  const match = openTag.match(/\bclass="([^"]*)"/i);
  return match ? match[1].split(/\s+/).filter(Boolean) : [];
}

function hasClass(openTag, className) {
  return getClassNames(openTag).includes(className);
}

function findMatchingElement(html, openStart, tagName) {
  const matcher = new RegExp(`<\\/?${tagName}\\b[^>]*>`, 'gi');
  matcher.lastIndex = openStart;
  let depth = 0;
  let openEnd = -1;
  let match;

  while ((match = matcher.exec(html))) {
    const token = match[0];
    const closing = /^<\//.test(token);
    const selfClosing = /\/>$/.test(token);

    if (!closing && !selfClosing) {
      depth += 1;
      if (openEnd === -1) openEnd = matcher.lastIndex;
    } else if (closing) {
      depth -= 1;
      if (depth === 0) {
        return {
          openStart,
          openEnd,
          closeStart: match.index,
          end: matcher.lastIndex
        };
      }
    }
  }

  throw new Error(`Tag-ul <${tagName}> nu este închis corect.`);
}

function findElementByClass(html, tagName, className, fromIndex, toIndex) {
  const matcher = new RegExp(`<${tagName}\\b[^>]*>`, 'gi');
  matcher.lastIndex = fromIndex;
  let match;

  while ((match = matcher.exec(html)) && match.index < toIndex) {
    if (!hasClass(match[0], className)) continue;
    return findMatchingElement(html, match.index, tagName);
  }

  return null;
}

function findSectionByAriaLabel(html, ariaLabel) {
  const matcher = /<section\b[^>]*>/gi;
  let match;

  while ((match = matcher.exec(html))) {
    const aria = match[0].match(/\baria-label="([^"]*)"/i);
    if (aria && decodeHtml(aria[1]) === ariaLabel) {
      return findMatchingElement(html, match.index, 'section');
    }
  }

  throw new Error(`Secțiunea "${ariaLabel}" nu a fost găsită.`);
}

function listAlbumRows(html) {
  const music = findSectionByAriaLabel(html, 'Music');
  const rows = [];
  let cursor = music.openEnd;

  while (cursor < music.closeStart) {
    const row = findElementByClass(html, 'div', 'media-row', cursor, music.closeStart);
    if (!row) break;

    const openingTag = html.slice(row.openStart, row.openEnd);
    const block = html.slice(row.openEnd, row.closeStart);
    const heading = block.match(/<h3(?:\s[^>]*)?>([\s\S]*?)<\/h3>/i);

    if (heading) {
      rows.push({
        ...row,
        title: textContent(heading[1]),
        classes: getClassNames(openingTag)
      });
    }

    cursor = row.end;
  }

  return rows;
}

function listAlbums(html) {
  const rows = listAlbumRows(html);
  const latest = rows.filter(row => row.classes.includes('album-latest'));
  const singles = rows.filter(row => row.classes.includes('album-singles-current'));
  const remaining = rows.filter(
    row => !row.classes.includes('album-latest') &&
      !row.classes.includes('album-singles-current')
  );

  return [...latest, ...singles, ...remaining].map(row => row.title);
}

function findAlbumRow(html, album) {
  const row = listAlbumRows(html).find(candidate => candidate.title === album);
  if (!row) throw new Error(`Albumul "${album}" nu există în site.`);
  return row;
}

function findGalleryInRange(html, range, className = 'gallery') {
  const gallery = findElementByClass(
    html,
    'div',
    className,
    range.openEnd,
    range.closeStart
  );

  if (!gallery) throw new Error(`Galeria "${className}" nu a fost găsită.`);
  return gallery;
}

function figureTitles(html, range) {
  const content = html.slice(range.openEnd, range.closeStart);
  return [...content.matchAll(/<figcaption>([\s\S]*?)<\/figcaption>/gi)]
    .map(match => textContent(match[1]));
}

function makeAlbumTile({ title, assetName, version }) {
  const safeTitle = escapeHtml(title);
  const safeAsset = escapeHtml(assetName);
  return `<figure class="tile"><img alt="${safeTitle}" loading="lazy" data-src="assets/${safeAsset}?v=${version}"><figcaption>${safeTitle}</figcaption></figure>`;
}

function makeRecentTile({ title, assetName, version, youtubeUrl, tiktokUrl }) {
  const safeTitle = escapeHtml(title);
  const safeAsset = escapeHtml(assetName);
  const safeYoutube = escapeHtml(normalizeTrackYoutubeUrl(youtubeUrl));
  const safeTikTok = escapeHtml(normalizeTikTokUrl(tiktokUrl));

  return `<figure class="tile"><img alt="${safeTitle}" loading="lazy" data-src="assets/${safeAsset}?v=${version}"><figcaption>${safeTitle}</figcaption><div class="recent-links"><a href="${safeYoutube}" rel="noopener" target="_blank">YouTube</a><a href="${safeTikTok}" rel="noopener" target="_blank">TikTok</a></div></figure>`;
}

function normalizeAlbumYoutubeUrl(value) {
  const parsed = parseUrl(value, 'Linkul YouTube al albumului');
  const playlistId = parsed.searchParams.get('list');

  if (!playlistId) {
    throw new Error('Linkul YouTube al albumului trebuie să conțină parametrul list.');
  }

  return `https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}&index=1`;
}

function normalizeTrackYoutubeUrl(value) {
  const parsed = parseUrl(value, 'Linkul YouTube al piesei');
  const videoId = parsed.searchParams.get('v');
  const playlistId = parsed.searchParams.get('list');

  if (!videoId || !playlistId) {
    throw new Error('Linkul pentru Ultimele lansări trebuie să conțină v și list.');
  }

  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&list=${encodeURIComponent(playlistId)}`;
}

function normalizeTikTokUrl(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return PROFILE_TIKTOK_URL;

  const parsed = parseUrl(trimmed, 'Linkul TikTok');
  if (!/(^|\.)tiktok\.com$/i.test(parsed.hostname)) {
    throw new Error('Linkul TikTok nu aparține domeniului tiktok.com.');
  }

  return parsed.toString();
}

function parseUrl(value, label) {
  const trimmed = String(value || '').trim();
  if (!trimmed) throw new Error(`${label} este obligatoriu.`);

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(`${label} nu este valid.`);
  }

  if (parsed.protocol !== 'https:') {
    throw new Error(`${label} trebuie să înceapă cu https://.`);
  }

  return parsed;
}

function addTrackToAlbum(html, data) {
  const row = findAlbumRow(html, data.album);
  const gallery = findGalleryInRange(html, row);

  if (figureTitles(html, gallery).includes(data.title)) {
    throw new Error(`Piesa "${data.title}" există deja în albumul "${data.album}".`);
  }

  const tile = makeAlbumTile(data);
  return html.slice(0, gallery.closeStart) + `\n${tile}` + html.slice(gallery.closeStart);
}

function clearLatestAlbumClass(html) {
  const music = findSectionByAriaLabel(html, 'Music');
  const segment = html.slice(music.openStart, music.end);
  const cleaned = segment.replace(
    /<div class="([^"]*\bmedia-row\b[^"]*)">/gi,
    (full, classes) => {
      const nextClasses = classes
        .split(/\s+/)
        .filter(Boolean)
        .filter(name => name !== 'album-latest');
      return `<div class="${nextClasses.join(' ')}">`;
    }
  );

  return html.slice(0, music.openStart) + cleaned + html.slice(music.end);
}

function addNewAlbum(html, data) {
  if (listAlbums(html).includes(data.album)) {
    throw new Error(`Albumul "${data.album}" există deja.`);
  }

  let updated = clearLatestAlbumClass(html);
  const music = findSectionByAriaLabel(updated, 'Music');
  const firstRow = listAlbumRows(updated)[0];
  const insertionPoint = firstRow ? firstRow.openStart : music.closeStart;
  const albumUrl = escapeHtml(normalizeAlbumYoutubeUrl(data.albumYoutubeUrl));
  const title = escapeHtml(data.album);
  const tile = makeAlbumTile(data);
  const block = [
    `<div class="media-row ${slugify(data.album)} album-latest">`,
    '<div class="media-content">',
    `<h3>${title}</h3>`,
    '<div class="btns">',
    `<a class="btn ytmusic" href="${albumUrl}" rel="noopener" target="_blank">🎧 YouTube Music</a>`,
    '</div>',
    '<div class="gallery">',
    tile,
    '</div>',
    '</div>',
    '</div>',
    ''
  ].join('\n');

  updated = updated.slice(0, insertionPoint) + block + updated.slice(insertionPoint);
  return updated;
}

function findChildFigures(html, gallery) {
  const figures = [];
  const matcher = /<figure\b[^>]*>/gi;
  matcher.lastIndex = gallery.openEnd;
  let match;

  while ((match = matcher.exec(html)) && match.index < gallery.closeStart) {
    const figure = findMatchingElement(html, match.index, 'figure');
    figures.push(figure);
    matcher.lastIndex = figure.end;
  }

  return figures;
}

function addToRecent(html, data) {
  const recent = findSectionByAriaLabel(html, 'Recent releases');
  let gallery = findGalleryInRange(html, recent, 'recent-gallery');

  if (figureTitles(html, gallery).includes(data.title)) {
    throw new Error(`Piesa "${data.title}" există deja la Ultimele lansări.`);
  }

  const figures = findChildFigures(html, gallery);
  if (figures.length >= 10) {
    const removeCount = figures.length - 9;
    const cutStart = figures[0].openStart;
    const cutEnd = figures[removeCount - 1].end;
    html = html.slice(0, cutStart) + html.slice(cutEnd);
    gallery = findGalleryInRange(
      html,
      findSectionByAriaLabel(html, 'Recent releases'),
      'recent-gallery'
    );
  }

  const tile = makeRecentTile(data);
  return html.slice(0, gallery.closeStart) + `\n${tile}` + html.slice(gallery.closeStart);
}

function updateSiteHtml(html, data) {
  const normalized = {
    title: String(data.title || '').trim(),
    album: String(data.album || '').trim(),
    assetName: String(data.assetName || '').trim(),
    version: String(data.version || '').trim(),
    albumYoutubeUrl: String(data.albumYoutubeUrl || '').trim(),
    youtubeUrl: String(data.youtubeUrl || '').trim(),
    tiktokUrl: String(data.tiktokUrl || '').trim(),
    isNewAlbum: Boolean(data.isNewAlbum),
    includeRecent: Boolean(data.includeRecent)
  };

  if (!normalized.title) throw new Error('Titlul piesei este obligatoriu.');
  if (!normalized.album) throw new Error('Albumul este obligatoriu.');
  if (!/^[a-z0-9][a-z0-9._-]*\.webp$/.test(normalized.assetName)) {
    throw new Error('Numele imaginii trebuie să fie lowercase, fără spații, și să se termine în .webp.');
  }
  if (!/^\d{12}$/.test(normalized.version)) {
    throw new Error('Versiunea cache-buster nu este validă.');
  }

  let updated = normalized.isNewAlbum
    ? addNewAlbum(html, normalized)
    : addTrackToAlbum(html, normalized);

  if (normalized.includeRecent) {
    updated = addToRecent(updated, normalized);
  }

  const recent = findSectionByAriaLabel(updated, 'Recent releases');
  const recentGallery = findGalleryInRange(updated, recent, 'recent-gallery');
  if (findChildFigures(updated, recentGallery).length !== 10) {
    throw new Error('Secțiunea Ultimele lansări trebuie să conțină exact 10 piese.');
  }

  return updated;
}

module.exports = {
  CURRENT_SINGLES_ALBUM,
  PROFILE_TIKTOK_URL,
  cacheVersion,
  escapeHtml,
  findSectionByAriaLabel,
  listAlbumRows,
  listAlbums,
  normalizeAlbumYoutubeUrl,
  normalizeTikTokUrl,
  normalizeTrackYoutubeUrl,
  slugify,
  updateSiteHtml
};
