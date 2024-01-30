import { canvasBackground } from "./canvas.js";
import { onMouseDown, onMouseMove, onMouseUp } from "./mouse.js";
import { resizeCanvas } from "./rect.js";
import { onKeyDown, remindShortcuts } from "./shortcuts.js";

resizeCanvas(screen.width, screen.height);

remindShortcuts();
document.addEventListener('keydown', onKeyDown);

canvasBackground.addEventListener('mousedown', onMouseDown);
canvasBackground.addEventListener('mousemove', onMouseMove);
canvasBackground.addEventListener('mouseup', onMouseUp);

window.electron.onStatus(console.log);
