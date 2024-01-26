// canvas
/** @type {HTMLCanvasElement} */
const canvas = document.querySelector('.main-canvas');
const ctx = canvas.getContext('2d');

/** @type {HTMLCanvasElement} */
const overlayCanvas = document.querySelector('.overlay-canvas');
const octx = overlayCanvas.getContext('2d');
const clearOverlay = () => octx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

resizeCanvas(screen.width, screen.height);

// rect
let rect;
fitRectToCanvas();
function updateRect(newRect) {
    let { x, y, w, h } = newRect;
    x = Math.floor(x);
    y = Math.floor(y);
    w = Math.floor(w);
    h = Math.floor(h);
    rect = { x, y, w, h };
    drawCrop();
}
function drawCrop() {
    let { x, y, w, h } = rect;
    octx.lineWidth = "1px";
    octx.strokeStyle = "#FFF";
    clearOverlay();
    octx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    octx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    octx.clearRect(x, y, w, h);
    octx.strokeStyle = '#FFF';
    octx.lineWidth = 1;
    octx.strokeRect(x, y, w, h);
}
function resizeCanvas(w, h) {
    overlayCanvas.width = canvas.width = w;
    overlayCanvas.height = canvas.height = h;
}
function fitRectToCanvas() {
    updateRect({ x: 0, y: 0, w: overlayCanvas.width, h: overlayCanvas.height });
}
function setRectEnd(x, y) {
    updateRect({ ...rect, w: x - rect.x, h: y - rect.y });
}
function setRectStart(x, y) {
    updateRect({ x, y, w: 0, h: 0 });
}
function getNormalRect() {
    const { x, y, w, h } = rect;
    return {
        x: Math.min(x, x + w),
        w: Math.abs(w),
        y: Math.min(y, y + h),
        h: Math.abs(h)
    };
}

async function loadImageOnCanvas(dataURL) {
    const image = new Image();
    image.src = dataURL;
    await new Promise(resolve => { image.onload = resolve; });

    resizeCanvas(image.width, image.height);
    fitRectToCanvas();
    ctx.drawImage(image, 0, 0);
}

window.electron.onGetInitImage(dataURL => loadImageOnCanvas(dataURL));

window.electron.scrape.onResult(result => {
    console.log(`Scrape:\n${result}`);
});

// keyboard
function formatShortcut(key) {
    return `"${key}" - ${shortcuts[key].name}`;
}
function formatShortcutDict() {
    return Object.keys(shortcuts).map(formatShortcut).join('\n')
}
const shortcuts = {
    v: async function paste() {
        const dataURL = await window.electron.getClipboardImage();
        if (dataURL) return loadImageOnCanvas(dataURL);
    },
    escape: function cancel() {
        fitRectToCanvas();
        isMouseDown = false;
    },
    s: function save() {
        const dataURL = canvas.toDataURL('image/png');
        window.electron.saveCanvas(dataURL);
    },
    t: async function tesseract() {
        const dataURL = canvas.toDataURL('image/png');
        const result = await window.electron.tesseractCanvas(dataURL);
        console.log(`Tesseract:\n${result.text}`);
    },
    r: async function scrape() {
        const URL = `http://prstats.tk`;
        window.electron.scrape.start(URL);
    },
};
console.log(formatShortcutDict());
document.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    const shortcut = shortcuts[key];
    if (!shortcut) return;
    console.log(formatShortcut(key));
    shortcut();
});

// mouse
function cropCanvas() {
    const { x, y, w, h } = getNormalRect();
    if (w < 1 || h < 1) return fitRectToCanvas();

    const tempCanvas = document.createElement('canvas');
    const tctx = tempCanvas.getContext('2d');
    tempCanvas.width = w;
    tempCanvas.height = h;
    tctx.drawImage(canvas, x, y, w, h, 0, 0, w, h);

    resizeCanvas(w, h);
    fitRectToCanvas();
    ctx.drawImage(tempCanvas, 0, 0);
}
function getCanvasMousePos(e) {
    const bcr = overlayCanvas.getBoundingClientRect();

    const scaleX = overlayCanvas.width / bcr.width;
    const scaleY = overlayCanvas.height / bcr.height;

    const x = Math.min(overlayCanvas.width, Math.max(0, (e.clientX - bcr.left) * scaleX));
    const y = Math.min(overlayCanvas.height, Math.max(0, (e.clientY - bcr.top) * scaleY));

    return [x, y];
}
let isMouseDown = false;
document.addEventListener('mousedown', e => {
    isMouseDown = true;
    const [x, y] = getCanvasMousePos(e);
    setRectStart(x, y);
});
document.addEventListener('mousemove', e => {
    if (!isMouseDown) return;
    const [x, y] = getCanvasMousePos(e);
    setRectEnd(x, y);
});
document.addEventListener('mouseup', e => {
    if (!isMouseDown) return;
    isMouseDown = false;
    const [x, y] = getCanvasMousePos(e);
    setRectEnd(x, y);
    cropCanvas();
});
