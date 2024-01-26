const { contextBridge, ipcRenderer } = require("electron");

const api = {
    status: message => ipcRenderer.send('status', message),
    receiveResult: result => ipcRenderer.send('scrape:receive-result', result)
};

contextBridge.exposeInMainWorld('electron', api);
