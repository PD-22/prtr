const { contextBridge, ipcRenderer } = require("electron");

const api = {
    status: (...args) => ipcRenderer.send('status', ...args),
    receiveResult: result => ipcRenderer.send('scrape:receive-result', result),
    onScrapeUsernames: callback => ipcRenderer.on('scrape:usernames', (_, value) => callback(value)),
};

contextBridge.exposeInMainWorld('electron', api);
