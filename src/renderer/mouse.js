import { canvas, canvasContainer, overlayCanvas } from "./canvas.js";
import { fitRectToCanvas, getNormalRect, setRectEnd, setRectStart } from "./rect.js";
import { clamp } from "../terminal/index.js";
import { modifierMatches } from "./shortcuts.js";
import { centerCanvas } from "./canvas.js";

const mouse = { isHold: false };
export default mouse;

export function getCanvasMousePos(e) {
    const bcr = canvas.getBoundingClientRect();

    const scaleX = canvas.width / bcr.width;
    const scaleY = canvas.height / bcr.height;

    const x = clamp((e.clientX - bcr.left) * scaleX, 0, canvas.width);
    const y = clamp((e.clientY - bcr.top) * scaleY, 0, canvas.height);

    return [x, y];
}

export function startDrag(e) {
    mouse.isHold = true;
    const [x, y] = getCanvasMousePos(e);
    setRectStart(x, y);
}

export function moveDrag(e) {
    if (!mouse.isHold) return;
    const [x, y] = getCanvasMousePos(e);
    setRectEnd(x, y);
}

export function stopDrag() {
    mouse.isHold = false;
    const { w, h } = getNormalRect();
    if (w < 1 || h < 1) return fitRectToCanvas();
}

export function zoom(e) {
    if (!modifierMatches(['ctrl'], e)) return;

    const canvasWidth = parseInt(canvas.width || 0);
    const canvasHeight = parseInt(canvas.height || 0);
    const parsedWidth = parseInt(canvas.style.width || canvasWidth);
    const parsedHeight = parseInt(canvas.style.height || canvasHeight);
    const scaleWidth = parsedWidth * 2 ** -Math.sign(e.deltaY) / canvasWidth;
    const scaleHeight = parsedHeight * 2 ** -Math.sign(e.deltaY) / canvasHeight;
    const newWidth = Math.floor(canvasWidth * clamp(scaleWidth, 1 / 8, 8));
    const newHeight = Math.floor(canvasHeight * clamp(scaleHeight, 1 / 8, 8));
    if (!newWidth && !newHeight) return;

    const styleWidth = `${newWidth}px`;
    const styleHeight = `${newHeight}px`;
    canvasContainer.style.width = styleWidth;
    canvasContainer.style.height = styleHeight;
    canvas.style.width = styleWidth;
    canvas.style.height = styleHeight;
    overlayCanvas.style.width = styleWidth;
    overlayCanvas.style.height = styleHeight;

    centerCanvas();
}
