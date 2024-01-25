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

window.electronAPI.onGetInitImage(dataURL => loadImageOnCanvas(dataURL));

window.electronAPI.onExtractHTML(html => {
    console.log('extract html given by child window');
    const document = new DOMParser().parseFromString(html, "text/html");
    const userAgent = document.querySelector('.value a').textContent;
    console.log('userAgent', userAgent);
});

// keyboard
const shortcuts = {
    s: () => {
        const dataURL = canvas.toDataURL('image/png');
        window.electronAPI.saveCanvas(dataURL);
    },
    v: async () => {
        const dataURL = await window.electronAPI.getClipboardImage();
        if (!dataURL) return console.error('Clipboard image not found');
        await loadImageOnCanvas(dataURL);
    },
    escape: () => {
        fitRectToCanvas();
        isMouseDown = false;
    },
    enter: async () => {
        const dataURL = canvas.toDataURL('image/png');
        const result = await window.electronAPI.tesseractCanvas(dataURL);
        console.log(result);
    },
    u: async () => {
        const URL = `https://www.whatismybrowser.com/detect/what-is-my-user-agent`;
        window.electronAPI.scrapeURL(URL);
    },
};
document.addEventListener('keydown', e => {
    const shortcut = shortcuts[e.key.toLowerCase()];
    if (!shortcut) return;
    console.log(`shortcut: "${e.key}"`);
    e.preventDefault();
    shortcut();
});

// mouse
function cropCanvas() {
    const { x, y, w, h } = getNormalRect();
    if (w < 1 || h < 1) {
        console.error('Rectangle too small');
        return fitRectToCanvas();
    }

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
