const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld('electronAPI', {
    getClipboardImage: () => ipcRenderer.invoke('get-clipboard-image'),
    saveCanvas: (imageData) => ipcRenderer.send('save-canvas', imageData)
});
