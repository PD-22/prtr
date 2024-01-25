const { contextBridge, ipcRenderer } = require("electron");

const api = {
    getClipboardImage: () => ipcRenderer.invoke('get-clipboard-image'),
    saveCanvas: dataURL => ipcRenderer.send('save-canvas', dataURL),
    tesseractCanvas: dataURL => ipcRenderer.invoke('tesseract-canvas', dataURL),
    onGetInitImage: callback => ipcRenderer.on('get-init-image', (_event, value) => callback(value)),
    scrape: {
        onExtractHTML: callback => ipcRenderer.on('scrape:extract-html', (_, value) => callback(value)),
        loadURL: url => ipcRenderer.send('scrape:load-url', url)
    }
};

contextBridge.exposeInMainWorld('electron', api);
