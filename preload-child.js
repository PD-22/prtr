console.log('preload-child.js loaded');

const { ipcRenderer } = require("electron");

ipcRenderer.on('send-back-html', () =>
    ipcRenderer.send('here-is-html', document.documentElement.innerHTML)
);
