const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld('electronAPI', {
    getClipboardImage: () => ipcRenderer.invoke('get-clipboard-image'),
    saveCanvas: dataURL => ipcRenderer.send('save-canvas', dataURL),
    tesseractCanvas: dataURL => ipcRenderer.invoke('tesseract-canvas', dataURL),
    onGetInitImage: callback => ipcRenderer.on('get-init-image', (_event, value) => callback(value))
});
