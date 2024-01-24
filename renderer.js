// canvas
const canvas = document.querySelector('.main-canvas');
const ctx = canvas.getContext('2d');

const overlayCanvas = document.querySelector('.overlay-canvas');
const octx = overlayCanvas.getContext('2d');

const clearOverlay = () => octx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

// rect
let rect = { x: 0, y: 0, w: 0, h: 0 };
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
    fitRectToCanvas();
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

// keyboard
const shortcuts = {
    s: () => {
        console.log(`s was pressed`);
        const dataURL = canvas.toDataURL('image/png');
        window.electronAPI.saveCanvas(dataURL);
    },
    v: async () => {
        console.log(`v was pressed`);
        const { dataURL, width, height, isEmpty } = await window.electronAPI.getClipboardImage();
        if (isEmpty) return alert('Clipboard image not found');

        const img = new Image();
        img.src = dataURL;
        await new Promise(resolve => { img.onload = resolve });

        resizeCanvas(width, height);
        ctx.drawImage(img, 0, 0);
    },
    Enter: () => {
        console.log(`Enter was pressed`);

        const { x, y, w, h } = getNormalRect();
        if (w < 1 || h < 1) return alert('Rectangle too small');

        const tempCanvas = document.createElement('canvas');
        const tctx = tempCanvas.getContext('2d');
        tempCanvas.width = w;
        tempCanvas.height = h;
        tctx.drawImage(canvas, x, y, w, h, 0, 0, w, h);

        resizeCanvas(w, h);
        ctx.drawImage(tempCanvas, 0, 0);
    }
};
document.addEventListener('keydown', ({ key }) => { shortcuts[key]?.(); });

// mouse
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
    isMouseDown = false;
    const [x, y] = getCanvasMousePos(e);
    setRectEnd(x, y);
});
