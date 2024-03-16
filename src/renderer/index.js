import * as terminal from "../terminal/index.js";
import { canvasBackground, scrollBy, zoom } from "./canvas.js";
import { getCanvasMousePos, getCanvasMouseRelPos, moveDrag, startDrag, stopDrag } from "./mouse.js";
import { onKeyDown } from "./shortcuts.js";

document.addEventListener('keydown', onKeyDown);

terminal.element.addEventListener('input', terminal.onInput);

canvasBackground.addEventListener('mousedown', startDrag);
canvasBackground.addEventListener('mousemove', moveDrag);
canvasBackground.addEventListener('mouseup', stopDrag);
canvasBackground.addEventListener('mouseleave', stopDrag);
window.addEventListener('wheel', e => {
    const sign = Math.sign(e.deltaY);
    if (e.ctrlKey) return zoom(sign < 0, getCanvasMouseRelPos(e));
    const d = [0, 0];
    d[e.shiftKey ? 0 : 1] = (e.altKey ? 10 : 100) * sign;
    scrollBy(...d);
});

// DEBUG
window.addEventListener('mousemove', e => {
    const [mx, my] = getCanvasMousePos(e);
    const elt = document.querySelector('.debug-mouse');
    const mxs = (mx || 0).toString().padEnd(4, ' ');
    const mys = my || 0;
    elt.textContent = [mxs, mys].join(' ');
});

api.onStatus(console.log);
