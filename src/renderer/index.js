import { canvasBackground } from "./canvas.js";
import { getCanvasMousePos, moveDrag, startDrag, stopDrag, zoom } from "./mouse.js";
import { resizeCanvas } from "./rect.js";
import { onKeyDown } from "./shortcuts.js";
import * as terminal from "../terminal/index.js";

resizeCanvas(0, 0);

document.addEventListener('keydown', onKeyDown);

terminal.element.addEventListener('input', terminal.onInput);

canvasBackground.addEventListener('mousedown', startDrag);
canvasBackground.addEventListener('mousemove', moveDrag);
canvasBackground.addEventListener('mouseup', stopDrag);
canvasBackground.addEventListener('mouseleave', stopDrag);
window.addEventListener('wheel', zoom);

// DEBUG
window.addEventListener('mousemove', e => {
    const [mx, my] = getCanvasMousePos(e);
    const elt = document.querySelector('.debug-mouse');
    const mxs = (mx || 0).toString().padEnd(4, ' ');
    const mys = my || 0;
    elt.textContent = [mxs, mys].join(' ');
});

api.onStatus(console.log);
