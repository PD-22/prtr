const { contextBridge, ipcRenderer } = require("electron");

const api = {
    status: (...args) => ipcRenderer.send('status', ...args),
    onStatus: callback => ipcRenderer.on('status', (_, value) => callback(value)),
    loadCanvasImage: () => ipcRenderer.invoke('load-canvas-image'),
    getClipboardImage: () => ipcRenderer.invoke('get-clipboard-image'),
    saveCanvas: dataURL => ipcRenderer.send('save-canvas', dataURL),
    scrapeTesseract: dataURL => ipcRenderer.send('scrape:tesseract', dataURL),
    scrapeTesseractConfirm: data => ipcRenderer.send('scrape:tesseract-confirm', data),
    onScrapeTesseractConfirm: callback =>
        ipcRenderer.on('scrape:tesseract-confirm', (_, value) => callback(value)),
    scrapeTesseractConfirmDone: data => ipcRenderer.send('scrape:tesseract-confirm-done', data),
    onScrapeResult: callback => ipcRenderer.on('scrape:result', (_, value) => callback(value)),
};

contextBridge.exposeInMainWorld('electron', api);
