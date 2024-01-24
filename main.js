const { app, BrowserWindow, clipboard, ipcMain, dialog } = require('electron');
const { writeFileSync, readFileSync } = require('fs');
const path = require('path');
const { createWorker } = require('tesseract.js');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
/** @type {BrowserWindow | undefined} */
let win;

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        },
        fullscreen: true,
        frame: false
    })

    // and load the index.html of the app.
    win.loadFile('index.html')

    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null
    });
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
    win.webContents.send('get-init-image', `data:image/png;base64,${base64}`);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    createWindow();
    win.webContents.on('did-finish-load', () => { getInitImage(); });

    ipcMain.handle('get-clipboard-image', () => {
        const image = clipboard.readImage();
        if (image.isEmpty()) return null;
        return image.toDataURL();
    });

    ipcMain.on('save-canvas', (e, dataURL) => {
        const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');

        dialog.showSaveDialog({
            title: 'Save Image',
            filters: [{
                name: 'Images',
                extensions: ['png']
            }],
            defaultPath: "output"
        }).then(({ canceled, filePath }) => {
            if (canceled) return console.log('Save canceled');;
            writeFileSync(filePath, base64Data, 'base64');
            console.log(`Saved to "${filePath}"`);
        });
    });

    ipcMain.handle('tesseract-canvas', async (e, dataURL) => {
        const config = { load_system_dawg: false, load_freq_dawg: false };
        const worker = await createWorker('eng', undefined, undefined, config);
        const { data } = await worker.recognize(dataURL);
        await worker.terminate();
        return data;
    });
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
