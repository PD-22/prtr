import { clamp } from "../terminal/index.js";
import { canvas, getScale, getScroll, setScale, setScroll } from "./canvas.js";
import { fitRectToCanvas, getNormalRect, setRectEnd, setRectStart } from "./rect.js";

const mouse = { isHold: false };
export default mouse;

export function getCanvasMousePos(e) {
    const [x, y] = getCanvasMouseRelPos(e);
    const { width: w, height: h } = canvas;
    return [clamp(x, 0, w), clamp(y, 0, h)];
}

export function getCanvasMouseRelPos(e) {
    const bcr = canvas.getBoundingClientRect();

    const scaleX = canvas.width / bcr.width;
    const scaleY = canvas.height / bcr.height;

    const x = (e.clientX - bcr.left) * scaleX;
    const y = (e.clientY - bcr.top) * scaleY;

    return [x, y];
}

export function startDrag(e) {
    mouse.isHold = true;
    const [x, y] = getCanvasMousePos(e);
    setRectStart(x, y);
}

export function moveDrag(e) {
    if (!mouse.isHold) return;
    const [x, y] = getCanvasMousePos(e);
    setRectEnd(x, y);
}

export function stopDrag() {
    mouse.isHold = false;
    const { w, h } = getNormalRect();
    if (w < 1 || h < 1) return fitRectToCanvas();
}

export function zoom(dir, mousePos) {
    const step = 2;
    const limit = 3;

    const scale = getScale();
    const newScale = clamp(
        scale * step ** (dir ? 1 : -1),
        step ** -limit,
        step ** limit
    );

    if (newScale === scale) return;

    setScale(newScale);

    const sr = newScale / scale;
    const [x, y] = getScroll();
    setScroll(x * sr, y * sr);

    if (!mousePos) return;
    const mx = mousePos[0] - canvas.width / 2;
    const my = mousePos[1] - canvas.height / 2;
    const sd = newScale - scale;
    setScroll(x + mx * sd, y + my * sd);
}
