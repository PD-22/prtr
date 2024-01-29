const { app, BrowserWindow, clipboard, ipcMain, dialog } = require('electron');
const { join } = require('path');
const { createWorker } = require('tesseract.js');
const { writeFile, readFile } = require('fs/promises');

/** @type {BrowserWindow} */ let mainWindow = null;
/** @type {BrowserWindow} */ let statsWindow = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        webPreferences: {
            preload: join(__dirname, 'preload.js')
        },
        fullscreen: true,
        frame: false
    })
    mainWindow.loadFile(join(__dirname, 'index.html'))
    mainWindow.on('closed', () => { mainWindow = null });

    statsWindow = new BrowserWindow({
        parent: mainWindow,
        show: false,
        webPreferences: {
            nodeIntegration: false,
            preload: join(__dirname, 'preload-stats.js')
        }
    });

    statsWindow.on('closed', () => { statsWindow = null; });
}

app.whenReady().then(() => {
    createWindow();

    ipcMain.on('status', (_, ...args) => { status(...args) });

    let statsPageLoaded = false;
    mainWindow.webContents.on('did-finish-load', async () => {
        try {
            status('Prepare: START');
            statsPageLoaded = null;
            await statsWindow.loadURL('http://prstats.tk');

            status('Prepare: EXEC');
            const path = join(__dirname, 'postload-stats.js');
            const code = await readFile(path, 'utf8');
            await statsWindow.webContents.executeJavaScript(code + ';0');

            statsPageLoaded = true;
            status('Prepare: DONE');
        } catch (error) {
            statsPageLoaded = false;
            status('Prepare: ERROR');
            throw error;
        }
    });

    ipcMain.handle('import', async () => {
        try {
            status('Import: START');
            const { canceled, filePaths: [path] } = await dialog.showOpenDialog({
                title: 'Import',
                filters: [{ name: 'Images', extensions: ['png'] }],
                defaultPath: join(__dirname, "init.png")
            });
            if (canceled) return status('Import: CANCEL');

            const buffer = await readFile(path);
            const base64 = buffer.toString('base64');

            if (!base64.length) return status('Import: EMPTY');

            return `data:image/png;base64,${base64}`;
        } catch (error) {
            status('Import: ERROR');
            throw error;
        }
    });

    ipcMain.handle('paste', () => {
        try {
            const image = clipboard.readImage();
            if (image.isEmpty()) return status('Paste: EMPTY');
            return image.toDataURL();
        } catch (error) {
            status('Paste: ERROR');
            throw error;
        }
    });

    ipcMain.on('export', async (_, dataURL) => {
        try {
            status('Export: START');
            const { canceled, filePath } = await dialog.showSaveDialog({
                title: 'Export',
                filters: [{ name: 'Images', extensions: ['png'] }],
                defaultPath: join(__dirname, "output.png")
            });
            if (canceled) return status('Export: CANCEL');

            const base64 = dataURL.replace(/^data:image\/png;base64,/, '');
            await writeFile(filePath, base64, 'base64');
            status(`Export: DONE: "${filePath}"`);
        } catch (error) {
            status(`Export: ERROR`);
            throw error;
        }
    });

    ipcMain.handle('recoginze', async (_, dataURL) => {
        try {
            status('Recognize: START');
            const config = { load_system_dawg: false, load_freq_dawg: false };
            const worker = await createWorker('eng', undefined, undefined, config);
            const { data: { lines } } = await worker.recognize(dataURL);
            await worker.terminate();

            const whitespace = str => str.trim().replace(/\s+/g, ' ');
            const parsedLines = lines.map(l => l.text).map(whitespace).filter(Boolean);
            if (!parsedLines?.length) return status('Recognize: EMPTY');

            status('Recognize: DONE', parsedLines);
            return parsedLines;
        } catch (error) {
            status('Recognize: ERROR');
            throw error;
        }
    });

    ipcMain.handle('scrape', async (_, lines) => {
        try {
            status('Scrape: START');

            if (statsPageLoaded === false) throw new Error('Stats page is not loaded');
            if (statsPageLoaded !== true) await new Promise((resolve, reject) => {
                status('Scrape: WAIT: Prepare');
                ipcMain.once('stats-page-loaded', resolve);

                const ms = 60 * 1000;
                const timeoutMessage = 'Stats page loading timeout';
                setTimeout(() => reject(new Error(timeoutMessage)), ms);
            });

            status('Scrape: FETCH');
            const timeStats = await new Promise((resolve, reject) => {
                statsWindow.webContents.send('scrape', lines);

                ipcMain.once(`scrape:reply`, (_, response) => resolve(response));

                const ms = 30 * 1000;
                const timeoutTimeout = 'Stats page reply timeout';
                setTimeout(() => reject(new Error(timeoutTimeout)), ms);
            });

            status('Scrape: DONE', timeStats);
            return timeStats;
        } catch (error) {
            status('Scrape: ERROR');
            throw error;
        }
    });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (mainWindow === null) createWindow(); });

function status(message, bodyLines) {
    const indent = lines => lines.map(s => `${' '.repeat(2)}${s}`).join('\n');
    const result = `${message}${!bodyLines ? '' : `\n${indent(bodyLines)}`}`;
    console.log(result);
    mainWindow.webContents.send('status', result);
}
