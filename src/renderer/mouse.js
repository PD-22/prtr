import * as terminal from "../terminal/index.js";
import { canvas, scrollBy, zoom } from "./canvas.js";
import rect, { fitRectToCanvas, setRect } from "./rect.js";

let clientX, clientY;
const mouse = { isHold: false };
export default mouse;

export function getCanvasMouseRelPos({ clientX, clientY }) {
    const bcr = canvas.getBoundingClientRect();

    const scaleX = canvas.width / bcr.width;
    const scaleY = canvas.height / bcr.height;

    const x = (clientX - bcr.left) * scaleX;
    const y = (clientY - bcr.top) * scaleY;

    return [x, y];
}

function startDrag(e) {
    if (terminal.state.isOpen) return;

    if (mouse.isHold !== false) return stopDrag();

    mouse.isHold = [mouseSelect, null, mouseDrag][e.button]?.key;

    clientX = e.clientX;
    clientY = e.clientY;
}

export const mouseSelect = {
    key: 'L',
    input: 'MouseLeft+Drag',
    move: e => {
        const [px, py] = getCanvasMouseRelPos({ clientX, clientY });
        const [x, y] = getCanvasMouseRelPos(e);
        setRect(px, py, x, y);
    },
    stop: () => {
        const { w, h } = rect;
        if (w < 1 || h < 1) fitRectToCanvas();
    }
};

export const mouseDrag = {
    key: 'R',
    input: 'MouseRight+Drag',
    move: e => {
        const x = clientX - e.clientX;
        const y = clientY - e.clientY;
        scrollBy(x, y);
        clientX = e.clientX;
        clientY = e.clientY;
    }
}

function moveDrag(e) {
    if (terminal.state.isOpen) return;
    if (mouse.isHold === mouseSelect.key) mouseSelect.move(e);
    if (mouse.isHold === mouseDrag.key) mouseDrag.move(e);
}

export function stopDrag() {
    if (terminal.state.isOpen) return;
    if (mouse.isHold === mouseSelect.key) mouseSelect.stop();
    mouse.isHold = false;
}

function onWheel(e) {
    if (terminal.state.isOpen) return;
    const sign = Math.sign(e.deltaY);
    if (!e.ctrlKey) return zoom(sign < 0, getCanvasMouseRelPos(e));
    const d = [0, 0];
    d[e.shiftKey ? 0 : 1] = (e.altKey ? 10 : 100) * sign;
    scrollBy(...d);
}

export const mouseListeners = [
    ['mousedown', startDrag],
    ['mousemove', moveDrag],
    ['mouseup', stopDrag],
    ['mouseleave', stopDrag],
    ['wheel', onWheel]
];
