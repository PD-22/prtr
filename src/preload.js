const { contextBridge, ipcRenderer } = require("electron");

const api = {
    getClipboardImage: () => ipcRenderer.invoke('get-clipboard-image'),
    saveCanvas: dataURL => ipcRenderer.send('save-canvas', dataURL),
    onGetInitImage: callback => ipcRenderer.on('get-init-image', (_event, value) => callback(value)),
    scrapeTesseract: dataURL => ipcRenderer.send('scrape:tesseract', dataURL),
    onScrapeResult: callback => ipcRenderer.on('scrape:result', (_, value) => callback(value))
};

contextBridge.exposeInMainWorld('electron', api);
