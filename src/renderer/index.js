import { canvasBackground } from "./canvas.js";
import { moveDrag, startDrag, stopDrag } from "./mouse.js";
import { resizeCanvas } from "./rect.js";
import { onKeyDown, remindShortcuts } from "./shortcuts.js";

resizeCanvas(screen.width, screen.height);

remindShortcuts();
document.addEventListener('keydown', onKeyDown);

canvasBackground.addEventListener('mousedown', startDrag);
canvasBackground.addEventListener('mousemove', moveDrag);
canvasBackground.addEventListener('mouseup', stopDrag);
canvasBackground.addEventListener('mouseleave', stopDrag);

window.electron.onStatus(console.log);
