const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld('api', {
    status: (...args) => ipcRenderer.send('status', ...args),
    onStatus: callback => ipcRenderer.on('status', (_, ...args) => callback(...args)),
    importDialog: () => ipcRenderer.invoke('import-dialog'),
    importFile: path => ipcRenderer.invoke('import-file', path),
    exportDialog: () => ipcRenderer.invoke('export-dialog'),
    exportFile: (path, dataURL) => ipcRenderer.invoke('export-file', path, dataURL),
    paste: () => ipcRenderer.invoke('paste'),
    recognize: dataURL => ipcRenderer.invoke('recoginze', dataURL),
    scrape: (row, line) => ipcRenderer.invoke('scrape', row, line),
    abortScrape: row => ipcRenderer.send(`scrape:abort:${row}`)
});
