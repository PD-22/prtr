const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld('electronAPI', {
    saveClipboardImage: title => ipcRenderer.send('save-clipboard-image', title)
})
