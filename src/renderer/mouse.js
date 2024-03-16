import { clamp } from "../terminal/index.js";
import { canvas } from "./canvas.js";
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
