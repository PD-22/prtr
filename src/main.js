const { app, BrowserWindow, clipboard, ipcMain, dialog, globalShortcut } = require('electron');
const { join } = require('path');
const { createWorker } = require('tesseract.js');
const { writeFile, readFile } = require('fs/promises');
const { Observable } = require('./Observable');

/** @type {BrowserWindow} */ let mainWindow = null;
/** @type {BrowserWindow} */ let statsWindow = null;
const pageLoading = new Observable();
app.whenReady().then(async () => {
    addRestartListener();
    createWindows();
    addListeners();
    await loadWindows();
});

function status(message, body) {
    console.log([message, ...(body?.map?.(s => `  ${s}`) ?? [])].join('\n'));
    mainWindow.webContents.send('status', message, body);
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
        mainWindow.webContents.setZoomFactor(1);

        pageLoading.value = true;
        await statsWindow.loadURL('https://prstats.tk');

        const path = join(__dirname, 'postload-stats.js');
        const code = await readFile(path, 'utf8');
        const token = await statsWindow.webContents.executeJavaScript(code);
        if (!token) throw new Error("Token missing");

        pageLoading.value = false;
        status('Prepare: DONE', [token]);
    } catch (error) {
        pageLoading.value = null;
        status('Prepare: ERROR');
        throw error;
    }
}

function addRestartListener() {
    const restart = () => { app.relaunch(); app.exit(); };
    const accelerator = "CommandOrControl+R";
    app.on('browser-window-focus', () => globalShortcut.register(accelerator, restart));
    app.on('browser-window-blur', () => globalShortcut.unregister(accelerator));
}

function addListeners() {
    app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

    ipcMain.on('status', (_, ...args) => { status(...args); });

    ipcMain.handle('import', async () => {
        const { canceled, filePaths: [path] } = await dialog.showOpenDialog({
            title: 'Import',
            filters: [{ name: 'Image', extensions: ['png'] }],
            // defaultPath: join(__dirname, "init.png")
        });
        if (canceled) return;

        const buffer = await readFile(path);
        const base64 = buffer.toString('base64');

        if (!base64.length) return;

        return `data:image/png;base64,${base64}`;
    });

    ipcMain.handle('export', async (_, dataURL) => {
        const { canceled, filePath } = await dialog.showSaveDialog({
            title: 'Export',
            filters: [{ name: 'Image', extensions: ['png'] }],
            // defaultPath: join(__dirname, "output.png")
        });
        if (canceled) return;

        const base64 = dataURL.replace(/^data:image\/png;base64,/, '');
        await writeFile(filePath, base64, 'base64');
        return filePath;
    });

    ipcMain.handle('paste', () => {
        const image = clipboard.readImage();
        if (image.isEmpty()) return;
        return image.toDataURL('image/png');
    });

    ipcMain.handle('recoginze', async (_, dataURL) => {
        const config = { load_system_dawg: false, load_freq_dawg: false };
        const worker = await createWorker('eng', undefined, undefined, config);
        const { data: { lines } } = await worker.recognize(dataURL);
        await worker.terminate();

        const whitespace = str => str.trim().replace(/\s+/g, ' ');
        return lines.map(l => l.text).map(whitespace).filter(Boolean);
    });

    ipcMain.handle('scrape', (_, row, username) => {
        const scrapePromise = (async () => {
            while (pageLoading.value === true) await new Promise(
                resolve => pageLoading.once(Observable.EVENT, resolve)
            );
            if (pageLoading.value !== false) throw new Error('Stats page not available');

            return new Promise(resolve => {
                statsWindow.webContents.send('scrape', row, username);
                ipcMain.once(`scrape:${row}`, (_, response) => resolve(response));
            });
        })();

        const abortPromise = new Promise((_, reject) => {
            const abortChannel = `scrape:abort:${row}`;
            ipcMain.once(abortChannel, () => {
                statsWindow.webContents.send(abortChannel);
                reject('abort');
            });
        });

        return Promise.race([scrapePromise, abortPromise]);
    });
}
