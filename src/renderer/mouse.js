import * as terminal from "../terminal/index.js";
import { clamp } from "../terminal/index.js";
import { canvas, scrollBy } from "./canvas.js";
import { fitRectToCanvas, getNormalRect, setRectEnd, setRectStart } from "./rect.js";

let clientX, clientY;
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
    if (terminal.state.isOpen) return;

    if (mouse.isHold !== false) return stopDrag();

    mouse.isHold = 'LMR'.split('')[e.button];
    const [x, y] = getCanvasMousePos(e);

    if (mouse.isHold === 'L') {
        setRectStart(x, y);
    } else if (mouse.isHold === 'R') {
        clientX = e.clientX;
        clientY = e.clientY;
    }
}

export function moveDrag(e) {
    if (terminal.state.isOpen) return;

    if (mouse.isHold === false) return;
    const [x, y] = getCanvasMousePos(e);

    if (mouse.isHold === 'L') {
        setRectEnd(x, y);
    } else if (mouse.isHold === 'R') {
        const x = clientX - e.clientX;
        const y = clientY - e.clientY;
        scrollBy(x, y);
        clientX = e.clientX;
        clientY = e.clientY;
    }
}

export function stopDrag() {
    if (terminal.state.isOpen) return;

    if (mouse.isHold === 'L') {
        const { w, h } = getNormalRect();
        if (w < 1 || h < 1) fitRectToCanvas();
    }

    mouse.isHold = false;
}
