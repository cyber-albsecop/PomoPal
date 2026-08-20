const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pomo', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  alert: () => ipcRenderer.send('timer:alert')
});
