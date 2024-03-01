const { contextBridge, ipcRenderer } = require("electron");

const onScrape = getUserTime => ipcRenderer.on('scrape', (_, row, username) => {
    const sendChannel = `scrape:${row}`;
    const abortChannel = `scrape:abort:${row}`;
    const abortMessage = `Scrape: ABORT: ${username}`;

    /**@type {[Promise,Function]}*/
    const [promise, abort] = getUserTime(username);

    return new Promise((resolve, reject) => {
        const abortListener = () => {
            abort();
            reject(new Error(abortMessage));
        };

        const onfulfilled = result => {
            ipcRenderer.send(sendChannel, result);
            resolve();
        };

        const onrejected = error => {
            ipcRenderer.send(sendChannel, error);
            reject(error);
        };

        const onfinally = () => ipcRenderer.removeListener(abortChannel, abortListener);

        ipcRenderer.once(abortChannel, abortListener);
        promise.then(onfulfilled).catch(onrejected).finally(onfinally);
    })
});

contextBridge.exposeInMainWorld('electron', { onScrape });
