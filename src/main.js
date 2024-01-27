const { app, BrowserWindow, clipboard, ipcMain, dialog } = require('electron');
const { writeFileSync, readFileSync } = require('fs');
const { join } = require('path');
const { createWorker } = require('tesseract.js');

/** @type {BrowserWindow} */ let mainWindow = null;
/** @type {BrowserWindow} */ let childWindow = null;

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

    childWindow = new BrowserWindow({
        parent: mainWindow,
        show: false,
        webPreferences: {
            nodeIntegration: false,
            preload: join(__dirname, 'preload-child.js')
        }
    });

    status('Load page');
    childWindow.loadURL('http://prstats.tk');
    childWindow.on('closed', () => { childWindow = null; });
}

app.whenReady().then(() => {
    createWindow();

    ipcMain.on('status', (_, ...args) => { status(...args) });

    childWindow.webContents.on('did-finish-load', async () => {
        const path = join(__dirname, 'postload-child.js');
        const code = readFileSync(path, 'utf8');
        await childWindow.webContents.executeJavaScript(code);
        status('Page loaded');
    });

    let childPageLoaded = false;
    ipcMain.once('child-page-loaded', () => { childPageLoaded = true; });

    ipcMain.handle('load-canvas-image', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            title: 'Open Image',
            filters: [{ name: 'Images', extensions: ['png'] }],
            defaultPath: join(__dirname, "init.png")
        });
        const filePath = filePaths[0];

        if (canceled) return status('Load canceled');

        let buffer;
        try {
            buffer = readFileSync(filePath);
        } catch (error) {
            status('Image not loaded');
            return;
        }
        const base64 = buffer.toString('base64');
        return `data:image/png;base64,${base64}`;
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

        if (canceled) return status('Save canceled');;
        writeFileSync(filePath, base64Data, 'base64');
        status(`Saved to "${filePath}"`);
    });

    ipcMain.on('scrape:tesseract', async (_, dataURL) => {
        status('Recognize image');
        const config = { load_system_dawg: false, load_freq_dawg: false };
        const worker = await createWorker('eng', undefined, undefined, config);
        const { data: { lines } } = await worker.recognize(dataURL);
        await worker.terminate();

        if (!lines?.length) return status('No parsed lines');
        const parsedLines = lines.map(l => l.text.replaceAll('\n', ''));
        status(`Parsed lines:\n${parsedLines.map(x => `\t${x}`).join('\n')}`);
        mainWindow.webContents.send('scrape:tesseract-confirm', parsedLines);
    });

    ipcMain.on('scrape:tesseract-confirm-done', async (_, editedLines) => {
        status(`Edited lines:\n${editedLines.map(x => `\t${x}`).join('\n')}`);
        if (!childPageLoaded) await new Promise(resolve => {
            status('Wait page load');
            ipcMain.once('child-page-loaded', resolve);
        });
        childWindow.webContents.send('scrape:usernames', editedLines);
    });

    ipcMain.on('scrape:receive-result', (_, html) => {
        mainWindow.webContents.send('scrape:result', html);
    });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (mainWindow === null) createWindow(); });

function status(message) {
    console.log(message);
    if (mainWindow.webContents.isLoading()) return;
    mainWindow.webContents.send('status', message);
}
