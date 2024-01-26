console.log('preload-child.js loaded');

const { contextBridge, ipcRenderer } = require("electron");

const api = {
    receiveResult: result => ipcRenderer.send('scrape:receive-result', result)
};

contextBridge.exposeInMainWorld('electron', api);
