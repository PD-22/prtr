import { canvasBackground } from "./canvas.js";
import { formatShortcutDict, onKeyDown } from "./keyboard.js";
import { onMouseDown, onMouseMove, onMouseUp } from "./mouse.js";
import { fitRectToCanvas, resizeCanvas } from "./rect.js";

resizeCanvas(screen.width, screen.height);

fitRectToCanvas();

window.electron.status(formatShortcutDict());
document.addEventListener('keydown', onKeyDown);

canvasBackground.addEventListener('mousedown', onMouseDown);
canvasBackground.addEventListener('mousemove', onMouseMove);
canvasBackground.addEventListener('mouseup', onMouseUp);

window.electron.onScrapeResult(result => {
    // TODO: display result
});

window.electron.onStatus(console.log);
