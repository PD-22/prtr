import { canvasBackground } from "./canvas.js";
import { onKeyDown, remindShortcuts } from "./shortcuts.js";
import { onMouseDown, onMouseMove, onMouseUp } from "./mouse.js";
import { fitRectToCanvas, resizeCanvas } from "./rect.js";

resizeCanvas(screen.width, screen.height);

fitRectToCanvas();

remindShortcuts();
document.addEventListener('keydown', onKeyDown);

canvasBackground.addEventListener('mousedown', onMouseDown);
canvasBackground.addEventListener('mousemove', onMouseMove);
canvasBackground.addEventListener('mouseup', onMouseUp);

window.electron.onStatus(console.log);
