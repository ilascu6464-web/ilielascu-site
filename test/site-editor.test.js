'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  listAlbums,
  normalizeAlbumYoutubeUrl,
  updateSiteHtml
} = require('../site-editor');

function fixture() {
  const recent = Array.from({ length: 10 }, (_, index) => (
    `<figure class="tile"><img alt="Recent ${index}" data-src="assets/recent${index}.webp"><figcaption>Recent ${index}</figcaption><div class="recent-links"><a href="https://www.youtube.com/watch?v=v${index}&list=playlist">YouTube</a><a href="https://www.tiktok.com/@ilascu99">TikTok</a></div></figure>`
  )).join('\n');

  return `<!DOCTYPE html>
<html><body>
<section aria-label="Music" class="wrapper music-section">
<section aria-label="Recent releases" class="recent-releases">
<div class="gallery recent-gallery">
${recent}
</div>
</section>
<div class="media-row current album-latest">
<div class="media-content">
<h3>Current Album</h3>
<div class="btns"><a class="btn ytmusic" href="https://www.youtube.com/playlist?list=current&index=1">YouTube</a></div>
<div class="gallery">
<figure class="tile"><img alt="Old Track" data-src="assets/old.webp"><figcaption>Old Track</figcaption></figure>
</div>
</div>
</div>
<div class="media-row singles album-singles-current">
<div class="media-content">
<h3>Singles 2026</h3>
<div class="gallery"></div>
</div>
</div>
<div class="media-row archive">
<div class="media-content">
<h3>Archive</h3>
<div class="gallery"></div>
</div>
</div>
</section>
</body></html>`;
}

test('normalizes an album watch URL to a stable playlist URL', () => {
  assert.equal(
    normalizeAlbumYoutubeUrl('https://www.youtube.com/watch?v=video&list=album-list'),
    'https://www.youtube.com/playlist?list=album-list&index=1'
  );
});

test('adds a track to an album without changing Recent releases', () => {
  const html = updateSiteHtml(fixture(), {
    title: 'Bajo las Hojas',
    album: 'Current Album',
    assetName: 'bajolashojas.webp',
    version: '202607230506',
    includeRecent: false
  });

  assert.match(html, /<figcaption>Bajo las Hojas<\/figcaption>/);
  assert.equal((html.match(/recent-links/g) || []).length, 10);
  assert.match(html, /<figcaption>Recent 0<\/figcaption>/);
});

test('keeps exactly ten recent releases and appends the newest track', () => {
  const html = updateSiteHtml(fixture(), {
    title: 'Newest Track',
    album: 'Current Album',
    assetName: 'newest-track.webp',
    version: '202607231200',
    includeRecent: true,
    youtubeUrl: 'https://www.youtube.com/watch?v=new-video&list=album-list',
    tiktokUrl: 'https://www.tiktok.com/@ilascu99/video/123'
  });

  assert.doesNotMatch(html, /<figcaption>Recent 0<\/figcaption>/);
  assert.match(html, /<figcaption>Newest Track<\/figcaption>/);
  assert.equal((html.match(/recent-links/g) || []).length, 10);
});

test('adds a new latest album and preserves Singles 2026 as second visually', () => {
  const html = updateSiteHtml(fixture(), {
    title: 'First Track',
    album: 'New Album',
    assetName: 'first-track.webp',
    version: '202607231300',
    isNewAlbum: true,
    includeRecent: false,
    albumYoutubeUrl: 'https://www.youtube.com/watch?v=video&list=new-list'
  });

  assert.deepEqual(
    listAlbums(html).slice(0, 4),
    ['New Album', 'Singles 2026', 'Current Album', 'Archive']
  );
  assert.equal((html.match(/album-latest/g) || []).length, 1);
  assert.match(html, /playlist\?list=new-list&amp;index=1/);
});
