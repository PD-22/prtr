const { contextBridge, ipcRenderer } = require("electron");

const api = {
    status: (...args) => ipcRenderer.send('status', ...args),
    onStatus: callback => ipcRenderer.on('status', (_, value) => callback(value)),
    import: () => ipcRenderer.invoke('import'),
    export: dataURL => ipcRenderer.send('export', dataURL),
    paste: () => ipcRenderer.invoke('paste'),
    recognize: dataURL => ipcRenderer.invoke('recoginze', dataURL),
    scrape: data => ipcRenderer.invoke('scrape', data)
};

contextBridge.exposeInMainWorld('electron', api);
