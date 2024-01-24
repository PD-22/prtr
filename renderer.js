/* const options = {
    workerPath: "./node_modules/tesseract.js/dist/worker.min.js",
    // Unlike when used in a browser, corePath and langPath are resolved relative the worker using Electron.
    corePath: "../../../node_modules/tesseract.js-core/",
    langPath: "../../../lang-data",
    logger: m => console.log(m),
    // Disable gzip since the eng.traineddata file we are using is already uncompressed
    gzip: false,
    workerBlobURL: false
};

const config = {
    load_system_dawg: false,
    load_freq_dawg: false
}; */


/* (async () => {
    const worker = await Tesseract.createWorker("eng", undefined, options, config);
    const { data: { text } } = await worker.recognize("./squad.png");
    console.log(text);
    await worker.terminate();
})(); */

const canvas = document.querySelector('.main-canvas');
const ctx = canvas.getContext('2d');

const overlayCanvas = document.querySelector('.overlay-canvas');
const octx = overlayCanvas.getContext('2d');
const clearOverlay = () => octx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

let isMouseDown = false;

let rect = { x: 0, y: 0, w: 0, h: 0 };
function updateRect(newRect) {
    rect = newRect;
    octx.strokeStyle = "white";
    clearOverlay();
    octx.strokeRect(rect.x, rect.y, rect.w, rect.h)
}

function resizeCanvas(w, h) {
    overlayCanvas.width = canvas.width = w;
    overlayCanvas.height = canvas.height = h;
    updateRect({ x: 0, y: 0, w, h });
}

const shortcuts = {
    s: () => {
        console.log(`s was pressed`);
        const dataURL = canvas.toDataURL('image/png');
        window.electronAPI.saveCanvas(dataURL);
    },
    v: async () => {
        console.log(`v was pressed`);
        const { buffer, width, height, isEmpty } = await window.electronAPI.getClipboardImage();
        if (isEmpty) return alert('Clipboard image not found');

        resizeCanvas(width, height);
        const imageData = new ImageData(new Uint8ClampedArray(buffer), width, height);
        ctx.putImageData(imageData, 0, 0);
    }
};

document.addEventListener('keydown', ({ key }) => { shortcuts[key]?.(); });

function getCanvasMousePos(e) {
    const bcr = overlayCanvas.getBoundingClientRect();
    const x = Math.min(bcr.width, Math.max(0, e.x - bcr.x));
    const y = Math.min(bcr.height, Math.max(0, e.y - bcr.y));
    return [x, y];
}

document.addEventListener('mousedown', e => {
    isMouseDown = true;
    const [x, y] = getCanvasMousePos(e);
    updateRect({ x, y, w: 0, h: 0 });
});

document.addEventListener('mousemove', e => {
    if (!isMouseDown) return;
    const [x, y] = getCanvasMousePos(e);
    updateRect({ ...rect, w: x - rect.x, h: y - rect.y });
});

document.addEventListener('mouseup', e => {
    isMouseDown = false;
    const [x, y] = getCanvasMousePos(e);
    updateRect({ ...rect, w: x - rect.x, h: y - rect.y });
});
