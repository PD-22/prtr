import { canvas, canvasContainer, clearOverlay, octx, overlayCanvas } from "./canvas.js";

const rect = { x: 0, y: 0, w: 0, h: 0 };
const dash = { width: 2, length: 5 };
export default rect;

export function setRect(newRect) {
    let { x, y, w, h } = newRect;
    rect.x = Math.round(x);
    rect.y = Math.round(y);
    rect.w = Math.round(w);
    rect.h = Math.round(h);
    drawCrop();
}

function drawCrop() {
    octx.save();
    const { x, y, w, h } = rect;
    octx.lineWidth = dash.width;
    octx.strokeStyle = "#FFF";
    clearOverlay();
    octx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    octx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    octx.clearRect(x, y, w, h);
    octx.setLineDash([dash.length, dash.length]);
    octx.strokeRect(x, y, w, h);
    octx.restore();
}

export function fitRectToCanvas() {
    setRect({ x: 0, y: 0, w: overlayCanvas.width, h: overlayCanvas.height });
}

export function setRectEnd(x, y) {
    setRect({ ...rect, w: x - rect.x, h: y - rect.y });
}

export function setRectStart(x, y) {
    setRect({ x, y, w: 0, h: 0 });
}

export function getNormalRect() {
    const { x, y, w, h } = rect;
    return {
        x: Math.min(x, x + w),
        w: Math.abs(w),
        y: Math.min(y, y + h),
        h: Math.abs(h)
    };
}

export function getRectCanvasDataURL() {
    const { x, y, w, h } = getNormalRect();
    if (!w || !h) return;

    const rectCanvas = document.createElement('canvas');
    rectCanvas.width = w;
    rectCanvas.height = h;

    const ctx = rectCanvas.getContext('2d');
    ctx.drawImage(canvas, x, y, w, h, 0, 0, w, h);

    return rectCanvas.toDataURL('image/png');
}
