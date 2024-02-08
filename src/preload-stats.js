const { contextBridge, ipcRenderer } = require("electron");

const onScrape = getUserTime => ipcRenderer.on('scrape', (_, row, username) =>
    new Promise((resolve, reject) => {
        const scrapeChannel = `scrape:${row}`;
        const abortChannel = `scrape:abort:${row}`;

        const abortHandler = () => {
            abort();
            reject(new Error(`Scrape: ABORT: ${username}`));
        };
        const dataHandler = result => {
            ipcRenderer.send(scrapeChannel, result)
            resolve();
        };
        const errorHandler = (error) => {
            ipcRenderer.send(scrapeChannel, null)
            reject(error);
        }
        const finalHandler = () => {
            ipcRenderer.removeListener(abortChannel, abortHandler);
        };

        ipcRenderer.once(abortChannel, abortHandler);

        /** @type {Promise} */
        const [promise, abort] = getUserTime(username);
        promise.then(dataHandler).catch(errorHandler).finally(finalHandler);
    })
);

contextBridge.exposeInMainWorld('electron', { onScrape });
