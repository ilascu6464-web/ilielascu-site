// Lista albumelor existente din site
const ALBUMS = [
  { name: 'Singles 2026',                 key: 'singles2026' },
  { name: 'Singles 2025',                 key: 'singles2025' },
  { name: 'The Perception of Reality',    key: 'perc' },
  { name: 'The Wailing Wall Weeps',       key: 'wall' },
  { name: 'Night Flight with Frédéric',   key: 'night' },
  { name: 'Tibethana – The Eternal Breath', key: 'tib' },
  { name: 'Contemporary dysfunction',     key: 'dys' },
  { name: 'Blue Geometry Waltz',          key: 'bluegeo' },
  { name: 'Incursiune în Imposibil',      key: 'incurs' },
  { name: 'Biography in Sound',           key: 'bio' },
  { name: 'The Best of — Collection',     key: 'best' },
  { name: 'Hai la joc',                   key: 'dance' },
  { name: 'Jazz Scratches',               key: 'scratches' },
  { name: 'Hop & Jazz',                   key: 'hop' },
  { name: 'ANALOG CONFLICT',              key: 'analog' },
  { name: 'ORBITA ZERO — Album',          key: 'orbita' },
  { name: 'ABOUT THE MOTH — Album',       key: 'moth' },
];

// Populează select cu albumele existente
const select = document.getElementById('albumSelect');
ALBUMS.forEach(a => {
  const opt = document.createElement('option');
  opt.value = a.name;
  opt.textContent = a.name;
  // Inserăm înainte de opțiunea "Album nou"
  select.insertBefore(opt, select.lastElementChild);
});

// Afișează/ascunde câmpurile pentru album nou
select.addEventListener('change', () => {
  const isNew = select.value === '__new__';
  document.getElementById('albumNew').classList.toggle('visible', isNew);
});

// Cover — click
let coverPath = null;
const coverZone = document.getElementById('coverZone');
const coverPreview = document.getElementById('coverPreview');
const coverPlaceholder = document.getElementById('coverPlaceholder');
const pushBtn = document.getElementById('pushBtn');

coverZone.addEventListener('click', async () => {
  const p = await window.flyAPI.pickCover();
  if (p) setCover(p);
});

// Cover — drag & drop
coverZone.addEventListener('dragover', e => { e.preventDefault(); coverZone.classList.add('drag-over'); });
coverZone.addEventListener('dragleave', () => coverZone.classList.remove('drag-over'));
coverZone.addEventListener('drop', e => {
  e.preventDefault();
  coverZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) setCover(file.path);
});

function setCover(p) {
  coverPath = p;
  coverPreview.src = 'file://' + p;
  coverPreview.style.display = 'block';
  coverPlaceholder.style.display = 'none';
}

// FLY button
document.getElementById('flyBtn').addEventListener('click', async () => {
  const title      = document.getElementById('title').value.trim();
  const albumSel   = select.value;
  const isNewAlbum = albumSel === '__new__';
  const album      = isNewAlbum
    ? document.getElementById('albumName').value.trim()
    : albumSel;
  const ytlink     = document.getElementById('ytlink').value.trim();
  const rumblelink = document.getElementById('rumblelink').value.trim();

  // Validare
  if (!title)  return setStatus('❗ Titlul este obligatoriu.', false);
  if (!album)  return setStatus('❗ Albumul este obligatoriu.', false);
  if (!coverPath) return setStatus('❗ Cover-ul este obligatoriu.', false);

  const btn = document.getElementById('flyBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Se procesează...';
  setStatus('');

  const result = await window.flyAPI.fly({
    title, album, coverPath,
    ytlink, rumblelink, isNewAlbum
  });

  btn.disabled = false;
  btn.textContent = '✈️ FLY';
  setStatus(result.message, result.ok);

  // Reset formular dacă a mers
  if (result.ok) {
    document.getElementById('title').value = '';
    document.getElementById('ytlink').value = '';
    document.getElementById('rumblelink').value = '';
    select.value = '';
    document.getElementById('albumNew').classList.remove('visible');
    coverPath = null;
    coverPreview.src = '';
    coverPreview.style.display = 'none';
    coverPlaceholder.style.display = 'flex';
  }
});

function setStatus(msg, ok) {
  const s = document.getElementById('status');
  s.textContent = msg;
  s.className = 'status' + (ok === true ? ' ok' : ok === false ? ' err' : '');
}

pushBtn.addEventListener('click', pushGitHub);

async function pushGitHub() {
  pushBtn.disabled = true;
  pushBtn.textContent = '⏳ Push...';
  setStatus('Se face push pe GitHub...', null);
  try {
    const res = await window.flyAPI.pushGitHub();
    if (res.ok) {
      setStatus('✅ Push reușit pe GitHub!', true);
      pushBtn.textContent = '✅ Pushed!';
      setTimeout(() => {
        pushBtn.textContent = '🚀 Push GitHub';
        pushBtn.disabled = false;
      }, 3000);
    } else {
      setStatus('❌ Eroare push: ' + res.error, false);
      pushBtn.textContent = '🚀 Push GitHub';
      pushBtn.disabled = false;
    }
  } catch (e) {
    setStatus('❌ Eroare: ' + e.message, false);
    pushBtn.textContent = '🚀 Push GitHub';
    pushBtn.disabled = false;
  }
}
