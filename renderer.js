'use strict';

const api = window.flyAPI;
const elements = {
  album: document.getElementById('album'),
  albumName: document.getElementById('albumName'),
  albumNewFields: document.getElementById('albumNewFields'),
  albumYoutube: document.getElementById('albumYoutube'),
  coverPlaceholder: document.getElementById('coverPlaceholder'),
  coverPreview: document.getElementById('coverPreview'),
  coverZone: document.getElementById('coverZone'),
  includeRecent: document.getElementById('includeRecent'),
  publish: document.getElementById('publish'),
  recentFields: document.getElementById('recentFields'),
  sitePath: document.getElementById('sitePath'),
  status: document.getElementById('status'),
  tiktokUrl: document.getElementById('tiktokUrl'),
  title: document.getElementById('title'),
  youtubeUrl: document.getElementById('youtubeUrl')
};

let coverPath = null;

initialize();

async function initialize() {
  if (!api) {
    setStatus('FlyDBX trebuie deschis ca aplicație macOS.', false);
    elements.publish.disabled = true;
    return;
  }

  try {
    await refreshSiteState();
    bindInteractions();
    updateVisibility();
  } catch (error) {
    setStatus(error.message, false);
    elements.publish.disabled = true;
  }
}

async function refreshSiteState(selectedAlbum = '') {
  const state = await api.getSiteState();
  const options = [
    '<option value="">Alege albumul</option>',
    ...state.albums.map(album => {
      const safe = escapeHtml(album);
      return `<option value="${safe}">${safe}</option>`;
    }),
    '<option value="__new__">Album nou</option>'
  ];

  elements.album.innerHTML = options.join('');
  elements.album.value = selectedAlbum;
  elements.sitePath.textContent = state.siteDir;
}

function bindInteractions() {
  elements.album.addEventListener('change', updateVisibility);
  elements.includeRecent.addEventListener('change', updateVisibility);
  elements.coverZone.addEventListener('click', chooseCover);
  elements.coverZone.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') chooseCover();
  });
  elements.coverZone.addEventListener('dragover', event => {
    event.preventDefault();
    elements.coverZone.classList.add('is-dragging');
  });
  elements.coverZone.addEventListener('dragleave', () => {
    elements.coverZone.classList.remove('is-dragging');
  });
  elements.coverZone.addEventListener('drop', event => {
    event.preventDefault();
    elements.coverZone.classList.remove('is-dragging');
    const file = event.dataTransfer.files[0];
    if (!file) return;
    const selectedPath = api.getPathForFile(file);
    if (selectedPath) setCover(selectedPath);
  });
  elements.publish.addEventListener('click', publish);
}

function updateVisibility() {
  const isNewAlbum = elements.album.value === '__new__';
  elements.albumNewFields.hidden = !isNewAlbum;
  elements.recentFields.hidden = !elements.includeRecent.checked;
}

async function chooseCover() {
  const selected = await api.pickCover();
  if (selected) setCover(selected);
}

function setCover(selectedPath) {
  coverPath = selectedPath;
  elements.coverPreview.src = `file://${selectedPath}`;
  elements.coverPreview.hidden = false;
  elements.coverPlaceholder.hidden = true;
}

async function publish() {
  const isNewAlbum = elements.album.value === '__new__';
  const album = isNewAlbum
    ? elements.albumName.value.trim()
    : elements.album.value;
  const title = elements.title.value.trim();

  if (!title) return setStatus('Completează titlul piesei.', false);
  if (!album) return setStatus('Alege sau scrie albumul.', false);
  if (!coverPath) return setStatus('Alege coperta piesei.', false);
  if (isNewAlbum && !elements.albumYoutube.value.trim()) {
    return setStatus('Completează linkul YouTube al albumului.', false);
  }
  if (elements.includeRecent.checked && !elements.youtubeUrl.value.trim()) {
    return setStatus('Completează linkul YouTube direct al piesei.', false);
  }

  elements.publish.disabled = true;
  elements.publish.textContent = 'Se publică...';
  setStatus('FlyDBX verifică și publică modificarea.', null);

  try {
    const result = await api.publishTrack({
      title,
      album,
      coverPath,
      isNewAlbum,
      includeRecent: elements.includeRecent.checked,
      albumYoutubeUrl: elements.albumYoutube.value.trim(),
      youtubeUrl: elements.youtubeUrl.value.trim(),
      tiktokUrl: elements.tiktokUrl.value.trim()
    });

    setStatus(result.message, result.ok);
    if (result.ok) {
      await refreshSiteState(album);
      resetTrackFields();
    }
  } catch (error) {
    setStatus(error.message, false);
  } finally {
    elements.publish.disabled = false;
    elements.publish.textContent = 'Publică';
  }
}

function resetTrackFields() {
  elements.title.value = '';
  elements.youtubeUrl.value = '';
  elements.tiktokUrl.value = '';
  elements.albumYoutube.value = '';
  elements.albumName.value = '';
  coverPath = null;
  elements.coverPreview.src = '';
  elements.coverPreview.hidden = true;
  elements.coverPlaceholder.hidden = false;
}

function setStatus(message, ok) {
  elements.status.textContent = message || '';
  elements.status.className = 'status';
  if (ok === true) elements.status.classList.add('is-success');
  if (ok === false) elements.status.classList.add('is-error');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
