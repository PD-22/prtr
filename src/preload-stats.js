const { contextBridge, ipcRenderer } = require("electron");

const api = {
    onScrape: callback => ipcRenderer.on('scrape', async (_, index, line) => {
        const result = await callback(line);
        ipcRenderer.send(`scrape:${index}`, result);
    })
};

contextBridge.exposeInMainWorld('electron', api);
