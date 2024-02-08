const { contextBridge, ipcRenderer } = require("electron");

const api = {
    onScrape: callback => ipcRenderer.on('scrape', async (_, row, line) => {
        const result = await callback(row, line);
        ipcRenderer.send(`scrape:${row}`, result);
    }),
    onAbort: (row, abort) => ipcRenderer.on(`scrape:abort:${row}`, abort)
};

contextBridge.exposeInMainWorld('electron', api);
