import { canvas, clearOverlay, octx, overlayCanvas } from "./canvas.js";

const rect = { x: 0, y: 0, w: 0, h: 0 };
export default rect;

export function setRect(newRect) {
    let { x, y, w, h } = newRect;
    rect.x = Math.floor(x);
    rect.y = Math.floor(y);
    rect.w = Math.floor(w);
    rect.h = Math.floor(h);
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

export function resizeCanvas(w, h) {
    overlayCanvas.width = canvas.width = w;
    overlayCanvas.height = canvas.height = h;
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
