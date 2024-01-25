const { app, BrowserWindow, clipboard, ipcMain, dialog } = require('electron');
const { writeFileSync, readFileSync } = require('fs');
const path = require('path');
const { createWorker } = require('tesseract.js');

/** @type {BrowserWindow} */ let mainWindow = null;
/** @type {BrowserWindow} */ let childWindow = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        },
        fullscreen: true,
        frame: false
    })
    mainWindow.loadFile('index.html')
    mainWindow.on('closed', () => { mainWindow = null });

    childWindow = new BrowserWindow({
        parent: mainWindow,
        show: false,
        webPreferences: {
            nodeIntegration: false,
            preload: path.join(__dirname, 'preload-child.js')
        }
    });
    childWindow.webContents.on('dom-ready', () => {
        childWindow.send('send-back-html');
    });
    childWindow.on('closed', () => { childWindow = null; });
}

const INIT_IMAGE_PATH = path.join(__dirname, 'init.png');
function getInitImage() {
    let buffer;
    try {
        buffer = readFileSync(INIT_IMAGE_PATH);
    } catch (error) {
        console.error('Failed to load initial image');
        return;
    }
    const base64 = buffer.toString('base64');
    mainWindow.webContents.send('get-init-image', `data:image/png;base64,${base64}`);
}

app.whenReady().then(() => {
    createWindow();

    mainWindow.webContents.on('did-finish-load', getInitImage);

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
            defaultPath: "output"
        });

        if (canceled) return console.log('Save canceled');;
        writeFileSync(filePath, base64Data, 'base64');
        console.log(`Saved to "${filePath}"`);
    });

    ipcMain.handle('tesseract-canvas', async (e, dataURL) => {
        const config = { load_system_dawg: false, load_freq_dawg: false };
        const worker = await createWorker('eng', undefined, undefined, config);
        const { data } = await worker.recognize(dataURL);
        await worker.terminate();
        return data;
    });

    ipcMain.on('scrape-url', (_, url) => {
        childWindow.loadURL(url, { userAgent: 'Temporary user agent' });
    });

    ipcMain.on('here-is-html', (_, html) => {
        mainWindow.send('extract-html', html);
    });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (mainWindow === null) createWindow(); });
