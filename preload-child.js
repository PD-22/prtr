console.log('preload-child.js loaded');

const { ipcRenderer } = require("electron");

ipcRenderer.on('send-back-html', () => {
    console.log('preload: received sendbackhtml');
    ipcRenderer.send('here-is-html', document.documentElement.innerHTML);
});
