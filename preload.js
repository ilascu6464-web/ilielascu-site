const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('flyAPI', {
  pickCover: ()          => ipcRenderer.invoke('pick-cover'),
  fly:       (data)      => ipcRenderer.invoke('fly', data)
});
