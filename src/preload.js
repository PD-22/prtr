const { contextBridge, ipcRenderer } = require("electron");

const api = {
    status: (...args) => ipcRenderer.send('status', ...args),
    onStatus: callback => ipcRenderer.on('status', (_, value) => callback(value)),
    import: () => ipcRenderer.invoke('import'),
    export: dataURL => ipcRenderer.send('export', dataURL),
    paste: () => ipcRenderer.invoke('paste'),
    recognize: dataURL => ipcRenderer.invoke('recoginze', dataURL),
    scrape: (row, line) => ipcRenderer.invoke('scrape', row, line),
    abortScrape: row => ipcRenderer.send(`scrape:abort:${row}`)
};

contextBridge.exposeInMainWorld('electron', api);
