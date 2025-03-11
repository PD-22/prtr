const squirrel = require('electron-squirrel-startup');
const { app, BrowserWindow, clipboard, ipcMain, dialog, globalShortcut, Menu } = require('electron');
const { join } = require('path');
const { createWorker } = require('tesseract.js');
const { writeFile, readFile } = require('fs/promises');
const { Observable } = require('./Observable');

if (squirrel || process.argv[1] === '--squirrel-firstrun') app.quit();

Menu.setApplicationMenu(null);

/** @type {BrowserWindow} */ let mainWindow = null;
/** @type {BrowserWindow} */ let statsWindow = null;
const pageLoading = new Observable();
app.whenReady().then(async () => {
    addRestartListener();
    createWindows();
    addListeners();
    await loadWindows();
});

function echoStatus(message, body = [], permanent, id, alive) {
    if (body && !Array.isArray(body)) body = [body];
    const lines = message ? body.map(s => '  ' + s) : body;
    const text = [message, ...lines].filter(Boolean).join('\n');
    console.log(text || `id: ${JSON.stringify(id)}`);
    mainWindow.webContents.send('status', message, body, permanent, id, alive);
}

function createWindows() {
    mainWindow = new BrowserWindow({
        webPreferences: {
            preload: join(__dirname, 'preload.js')
        },
        // fullscreen: true
    })
    mainWindow.on('closed', () => { mainWindow = null });
    mainWindow.on('focus', () => globalShortcut.register('F11',
        () => mainWindow.setFullScreen(!mainWindow.isFullScreen())
    ));
    mainWindow.on('blur', () => globalShortcut.unregisterAll());
    // mainWindow.webContents.openDevTools();

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
        await mainWindow.loadFile(join(__dirname, 'index.html'));
        mainWindow.webContents.setZoomFactor(1);

        pageLoading.value = true;
        // await statsWindow.loadURL('https://prstats.realitymod.com');
        await statsWindow.loadURL('about:blank');

        const path = join(__dirname, 'postload-stats.js');
        const code = await readFile(path, 'utf8');
        const token = await statsWindow.webContents.executeJavaScript(code);
        if (!token) throw new Error("Token missing");

        pageLoading.value = false;
    } catch (error) {
        pageLoading.value = null;
        echoStatus('Error: Restart', undefined, true);
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
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindows(); });

    ipcMain.on('status', (_, ...args) => { echoStatus(...args); });

    ipcMain.handle('import-dialog', async () => {
        const { canceled, filePaths: [path] } = await dialog.showOpenDialog({
            title: 'Import',
            filters: [{ name: 'Image', extensions: ['png'] }],
        });
        if (canceled) return;
        return path;
    });
    ipcMain.handle('import-file', async (_, path) => {
        const buffer = await readFile(path);
        const base64 = buffer.toString('base64');
        if (!base64.length) return;
        return `data:image/png;base64,${base64}`;
    });

    ipcMain.handle('export-dialog', async () => {
        const { canceled, filePath } = await dialog.showSaveDialog({
            title: 'Export',
            filters: [{ name: 'Image', extensions: ['png'] }],
        });
        if (canceled) return;
        return filePath;
    });
    ipcMain.handle('export-file', async (_, filePath, dataURL) => {
        const base64 = dataURL.replace(/^data:image\/png;base64,/, '');
        await writeFile(filePath, base64, 'base64');
    });

    ipcMain.handle('paste', async () => {
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

        const abortPromise = new Promise(resolve => {
            const abortChannel = `scrape:abort:${row}`;
            ipcMain.once(abortChannel, () => {
                statsWindow.webContents.send(abortChannel);
                resolve();
            });
        });

        return Promise.race([scrapePromise, abortPromise]);
    });
}
