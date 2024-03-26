import { clamp } from "../terminal/index.js";
import { canvas, clearOverlay, getScale, getScroll, octx, overlayCanvas } from "./canvas.js";
import { stopDrag } from "./mouse.js";

const initRect = { x: 0, y: 0, x2: 0, y2: 0 };
const rect = { ...initRect };
const dash = { width: 2, length: 5 };
let dragging = false;
export default rect;

export function setRect(x, y, x2, y2) {
    Object.assign(rect, getNormalRect({ x, y, x2, y2 }));
    drawCrop();
    stopToggle();
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
    setRect(0, 0, overlayCanvas.width, overlayCanvas.height);
}

function getNormalRect(newRect = {}) {
    let { x, y, x2, y2, w, h } = newRect;
    x ??= rect.x;
    y ??= rect.y;
    x2 ??= rect.x2;
    y2 ??= rect.y2;
    w ??= rect.w;
    h ??= rect.h;

    const canvas = document.querySelector('.main-canvas');
    const cw = canvas.width;
    const ch = canvas.height;
    x = Math.round(clamp(x, 0, cw));
    x2 = Math.round(clamp(x2, 0, cw));
    y = Math.round(clamp(y, 0, ch));
    y2 = Math.round(clamp(y2, 0, ch));

    const asc = a => a.toSorted((b, c) => b - c);
    [x, x2] = asc([x, x2]);
    [y, y2] = asc([y, y2]);

    w = x2 - x;
    h = y2 - y;

    return { x, y, x2, y2, w, h };
}

export function getRectCanvasDataURL() {
    const { x, y, w, h } = rect;
    if (!w || !h) return;

    const rectCanvas = document.createElement('canvas');
    rectCanvas.width = w;
    rectCanvas.height = h;

    const ctx = rectCanvas.getContext('2d');
    ctx.drawImage(canvas, x, y, w, h, 0, 0, w, h);

    return rectCanvas.toDataURL('image/png');
}

export function toggleDrag() {
    return (dragging ? finishToggle : startToggle)();
}

function startToggle() {
    stopDrag();
    const [x, y] = getScroll();
    const s = getScale();
    const nx = canvas.width / 2 + x / s;
    const ny = canvas.height / 2 + y / s;
    setRect(nx, ny, nx, ny);
    dragging = [nx, ny];
}

export function scrollToggle(x, y) {
    if (!dragging) return;
    const s = getScale();
    const nx = canvas.width / 2 + x / s;
    const ny = canvas.height / 2 + y / s;
    const [dx, dy] = dragging;
    setRect(dx, dy, nx, ny);
    dragging = [dx, dy];
}

export function finishToggle() {
    stopToggle();

    const { x, x2, y, y2, w, h } = rect;
    const l = dash.length;
    if (w < l || h < l) return fitRectToCanvas();

    const z = 2 * l;
    if (w < z || h < z) setRect(
        (x + x2 - z) / 2,
        (y + y2 - z) / 2,
        (x + x2 + z) / 2,
        (y + y2 + z) / 2,
    )
}

function stopToggle() {
    dragging = false;
}
