const { contextBridge, ipcRenderer } = require("electron");

const api = {
    getClipboardImage: () => ipcRenderer.invoke('get-clipboard-image'),
    saveCanvas: dataURL => ipcRenderer.send('save-canvas', dataURL),
    tesseractCanvas: dataURL => ipcRenderer.invoke('tesseract-canvas', dataURL),
    onGetInitImage: callback => ipcRenderer.on('get-init-image', (_event, value) => callback(value)),
    scrape: {
        start: url => ipcRenderer.send('scrape:start', url),
        onResult: callback => ipcRenderer.on('scrape:result', (_, value) => callback(value))
    }
};

contextBridge.exposeInMainWorld('electron', api);
