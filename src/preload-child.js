console.log('preload-child.js loaded');

const { ipcRenderer } = require("electron");

ipcRenderer.on('scrape:send-html', () =>
    ipcRenderer.send('scrape:recieve-html', document.documentElement.innerHTML)
);
