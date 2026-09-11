const { contextBridge, ipcRenderer } = require('electron');

// Fixed operations only: no generic IPC, clipboard text or external URLs.
contextBridge.exposeInMainWorld('roletaDesktop', {
  getVersion: () => ipcRenderer.invoke('roleta:get-version'),
  copyContactEmail: () => ipcRenderer.invoke('roleta:copy-contact-email'),
  exitFullscreen: () => ipcRenderer.invoke('roleta:exit-fullscreen')
});
