const { contextBridge, ipcRenderer } = require("electron");

const api = {
    status: (...args) => ipcRenderer.send('status', ...args),
    receiveResult: result => ipcRenderer.send('scrape:receive-result', result)
};

contextBridge.exposeInMainWorld('electron', api);
