const { contextBridge, ipcRenderer } = require("electron");

const api = {
    status: (...args) => ipcRenderer.send('status', ...args),
    onStatus: callback => ipcRenderer.on('status', (_, value) => callback(value)),
    loadCanvasImage: () => ipcRenderer.invoke('load-canvas-image'),
    getClipboardImage: () => ipcRenderer.invoke('get-clipboard-image'),
    saveCanvas: dataURL => ipcRenderer.send('save-canvas', dataURL),
    scrapeTesseract: dataURL => ipcRenderer.send('scrape:tesseract', dataURL),
    onScrapeResult: callback => ipcRenderer.on('scrape:result', (_, value) => callback(value)),
};

contextBridge.exposeInMainWorld('electron', api);
