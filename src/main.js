const { app, BrowserWindow, clipboard, ipcMain, dialog } = require('electron');
const { join } = require('path');
const { createWorker } = require('tesseract.js');
const { writeFile, readFile } = require('fs/promises');
const { Observable } = require('./Observable');

/** @type {BrowserWindow} */ let mainWindow = null;
/** @type {BrowserWindow} */ let statsWindow = null;
const pageLoading = new Observable();
app.whenReady().then(async () => {
    createWindows();
    addListeners();
    await loadWindows();
});

function status(message, bodyLines) {
    const indent = lines => lines.map(s => `${' '.repeat(2)}${s}`).join('\n');
    const result = `${message}${!bodyLines ? '' : `\n${indent(bodyLines)}`}`;
    console.log(result);
    mainWindow.webContents.send('status', result);
}

function createWindows() {
    mainWindow = new BrowserWindow({
        webPreferences: {
            preload: join(__dirname, 'preload.js')
        },
        fullscreen: true,
        frame: false
    })
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

async function loadWindows() {
    try {
        status('Prepare: START');
        await mainWindow.loadFile(join(__dirname, 'index.html'));

        pageLoading.value = true;
        await statsWindow.loadURL('http://prstats.tk');

        const path = join(__dirname, 'postload-stats.js');
        const code = await readFile(path, 'utf8');
        await statsWindow.webContents.executeJavaScript(code + ';0');

        pageLoading.value = false;
        status('Prepare: DONE');
    } catch (error) {
        pageLoading.value = null;
        status('Prepare: ERROR');
        throw error;
    }
}

function addListeners() {
    app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

    ipcMain.on('status', (_, ...args) => { status(...args); });

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

    ipcMain.handle('paste', () => {
        try {
            const image = clipboard.readImage();
            if (image.isEmpty()) return status('Paste: EMPTY');
            return image.toDataURL('image/png');
        } catch (error) {
            status('Paste: ERROR');
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

    ipcMain.handle('scrape', async (_, line) => {
        while (pageLoading.value === true) await new Promise(resolve =>
            pageLoading.once(Observable.EVENT, resolve)
        );
        if (pageLoading.value !== false) throw new Error('Stats page not available');

        const stat = await new Promise(resolve => {
            statsWindow.webContents.send('scrape', line);
            ipcMain.once(`scrape:reply`, (_, response) => resolve(response));
        });

        return stat;
    });
}
