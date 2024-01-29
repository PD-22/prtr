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

    mainWindow.webContents.on('did-finish-load', async () => {
        status('Load stats page');
        statsWindow.loadURL('http://prstats.tk');
    });

    statsWindow.webContents.on('did-finish-load', async () => {
        const path = join(__dirname, 'postload-stats.js');
        try {
            const code = await readFile(path, 'utf8');
            await statsWindow.webContents.executeJavaScript(code + ';0');
            status('Stats page loaded');
        } catch (error) {
            status('Stats page load failed');
            throw error;
        }
    });

    let statsPageLoaded = false;
    ipcMain.once('stats-page-loaded', () => { statsPageLoaded = true; });

    ipcMain.handle('load-canvas-image', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            title: 'Open Image',
            filters: [{ name: 'Images', extensions: ['png'] }],
            defaultPath: join(__dirname, "init.png")
        });
        const filePath = filePaths[0];

        if (canceled) return status('Load canceled');

        try {
            const buffer = await readFile(filePath);
            const base64 = buffer.toString('base64');
            return `data:image/png;base64,${base64}`;
        } catch (error) {
            status('Image load failed');
            throw error;
        }
    });

    ipcMain.handle('get-clipboard-image', () => {
        const image = clipboard.readImage();
        if (image.isEmpty()) return null;
        return image.toDataURL();
    });

    ipcMain.on('save-canvas', async (e, dataURL) => {
        const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');

        const { canceled, filePath } = await dialog.showSaveDialog({
            title: 'Save Image',
            filters: [{ name: 'Images', extensions: ['png'] }],
            defaultPath: join(__dirname, "output.png")
        });

        if (canceled) return status('Save canceled');

        try {
            await writeFile(filePath, base64Data, 'base64');
            status(`Image saved to "${filePath}"`);
        } catch (error) {
            status(`Image save failed`);
            throw error;
        }
    });

    ipcMain.on('scrape:tesseract', async (_, dataURL) => {
        status('Recognize image');
        const config = { load_system_dawg: false, load_freq_dawg: false };
        const worker = await createWorker('eng', undefined, undefined, config);
        const { data: { lines } } = await worker.recognize(dataURL);
        await worker.terminate();

        const whitespace = str => str.trim().replace(/\s+/g, ' ');
        const parsedLines = lines.map(l => l.text).map(whitespace).filter(Boolean);
        if (!parsedLines?.length) return status('No parsed lines');
        status(`Parsed lines:\n${parsedLines.join('\n')}`);
        mainWindow.webContents.send('scrape:tesseract-confirm', parsedLines);
    });

    ipcMain.on('scrape:start', async (_, lines) => {
        status(`Scrape lines:\n${lines.join('\n')}`);
        if (!statsPageLoaded) await new Promise(resolve => {
            status('Wait page load');
            ipcMain.once('stats-page-loaded', resolve);
        });
        statsWindow.webContents.send('scrape:usernames', lines);
    });

    ipcMain.on('scrape:receive-result', (_, html) => {
        mainWindow.webContents.send('scrape:result', html);
    });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (mainWindow === null) createWindow(); });

function status(message) {
    console.log(message);
    mainWindow.webContents.send('status', message);
}
