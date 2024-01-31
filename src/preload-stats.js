const { contextBridge, ipcRenderer } = require("electron");

const api = {
    onScrape: callback => ipcRenderer.on('scrape', async (_, value) => {
        const result = await callback(value);
        ipcRenderer.send(`scrape:${value}`, result);
    })
};

contextBridge.exposeInMainWorld('electron', api);
