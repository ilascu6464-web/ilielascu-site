'use strict';

const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const test = require('node:test');

const databasePath = path.join(__dirname, '..', 'assets', 'albums_database.json');
const database = JSON.parse(fs.readFileSync(databasePath, 'utf8'));

test('RadioSIX database uses valid YouTube video IDs', () => {
  for (const album of database) {
    for (const track of album.tracks) {
      if (!track.youtube_id) continue;
      assert.match(
        track.youtube_id,
        /^[A-Za-z0-9_-]{11}$/,
        `${album.album_title} / ${track.title}`
      );
    }
  }
});

test('RadioSIX database never assigns one video to different song titles', () => {
  const titlesByVideoId = new Map();

  for (const album of database) {
    for (const track of album.tracks) {
      if (!track.youtube_id) continue;
      const titles = titlesByVideoId.get(track.youtube_id) || new Set();
      titles.add(track.title.normalize('NFC').toLocaleLowerCase());
      titlesByVideoId.set(track.youtube_id, titles);
    }
  }

  for (const [videoId, titles] of titlesByVideoId) {
    assert.equal(
      titles.size,
      1,
      `YouTube ID ${videoId} is assigned to: ${[...titles].join(', ')}`
    );
  }
});
