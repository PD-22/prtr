import { canvasBackground } from "./canvas.js";
import { moveDrag, startDrag, stopDrag } from "./mouse.js";
import { resizeCanvas } from "./rect.js";
import { onKeyDown } from "./shortcuts.js";

resizeCanvas(0, 0);

document.addEventListener('keydown', onKeyDown);

// terminal.element.addEventListener('input', onTerminalInput);

canvasBackground.addEventListener('mousedown', startDrag);
canvasBackground.addEventListener('mousemove', moveDrag);
canvasBackground.addEventListener('mouseup', stopDrag);
canvasBackground.addEventListener('mouseleave', stopDrag);

window.electron.onStatus(console.log);
