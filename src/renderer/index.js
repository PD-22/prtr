import note from "./note.js";
import * as terminal from "../terminal/index.js";
import { scrollBy, zoom } from "./canvas.js";
import { getCanvasMouseRelPos, moveDrag, startDrag, stopDrag } from "./mouse.js";
import { onKeyDown } from "./shortcuts.js";

document.addEventListener('keydown', onKeyDown);

terminal.element.addEventListener('input', terminal.onInput);

window.addEventListener('mousedown', startDrag);
window.addEventListener('mousemove', moveDrag);
window.addEventListener('mouseup', stopDrag);
window.addEventListener('mouseleave', stopDrag);
window.addEventListener('wheel', e => {
    const sign = Math.sign(e.deltaY);
    if (!e.ctrlKey) return zoom(sign < 0, getCanvasMouseRelPos(e));
    const d = [0, 0];
    d[e.shiftKey ? 0 : 1] = (e.altKey ? 10 : 100) * sign;
    scrollBy(...d);
});

api.onStatus((message, body) => {
    console.log([message, ...(body?.map?.(s => `  ${s}`) ?? [])].join('\n'));
    note(message, 30000, 5000);
});
