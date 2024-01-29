const { contextBridge, ipcRenderer } = require("electron");

const api = {
    status: (...args) => ipcRenderer.send('status', ...args),
    onScrape: callback => ipcRenderer.on('scrape', (_, value) => callback(value)),
    scrapeReply: result => ipcRenderer.send('scrape:reply', result),
    statsPageLoaded: () => ipcRenderer.send('stats-page-loaded'),
};

contextBridge.exposeInMainWorld('electron', api);
