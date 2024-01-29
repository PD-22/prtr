import { canvasBackground } from "./canvas.js";
import { onKeyDown, remindShortcuts } from "./keyboard.js";
import { onMouseDown, onMouseMove, onMouseUp } from "./mouse.js";
import { fitRectToCanvas, resizeCanvas } from "./rect.js";
import { openTerminal, writeTerminalLines } from "./terminal.js";

resizeCanvas(screen.width, screen.height);

fitRectToCanvas();

remindShortcuts();
document.addEventListener('keydown', onKeyDown);

canvasBackground.addEventListener('mousedown', onMouseDown);
canvasBackground.addEventListener('mousemove', onMouseMove);
canvasBackground.addEventListener('mouseup', onMouseUp);

window.electron.onScrapeResult(result => {
    writeTerminalLines(result);
    openTerminal();
});

window.electron.onStatus(console.log);
