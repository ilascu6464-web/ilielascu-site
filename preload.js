'use strict';

const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('flyAPI', {
  getSiteState: () => ipcRenderer.invoke('get-site-state'),
  getPathForFile: file => webUtils.getPathForFile(file),
  pickCover: () => ipcRenderer.invoke('pick-cover'),
  publishTrack: data => ipcRenderer.invoke('publish-track', data)
});
