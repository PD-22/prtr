import { clamp } from "../terminal/index.js";
import { canvas, canvasContainer, centerCanvas, overlayCanvas } from "./canvas.js";
import { fitRectToCanvas, getNormalRect, setRectEnd, setRectStart } from "./rect.js";

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

export function zoom(dir) {
    const sign = dir ? 1 : -1;

    const base = 2;
    const limit = base ** 3;
    const scale = base ** sign;

    const canvasWidth = parseInt(canvas.width || 0);
    const canvasHeight = parseInt(canvas.height || 0);
    const parsedWidth = parseInt(canvas.style.width || canvasWidth);
    const parsedHeight = parseInt(canvas.style.height || canvasHeight);
    const zoomWidth = parsedWidth / canvasWidth;
    const zoomHeight = parsedHeight / canvasHeight;
    const scaleWidth = clamp(zoomWidth * scale, 1 / limit, limit);
    const scaleHeight = clamp(zoomHeight * scale, 1 / limit, limit);
    const newWidth = canvasWidth * scaleWidth;
    const newHeight = canvasHeight * scaleHeight;

    const { scrollX, scrollY } = window;
    const dx = (scrollX + innerWidth / 2 - parsedWidth / 2) * newWidth / parsedWidth;
    const dy = (scrollY + innerHeight / 2 - parsedHeight / 2) * newHeight / parsedHeight;

    if (scaleWidth === zoomWidth || scaleHeight === zoomHeight) return;
    if (!newWidth || !newHeight) return;

    const styleWidth = `${Math.floor(newWidth)}px`;
    const styleHeight = `${Math.floor(newHeight)}px`;
    canvasContainer.style.width = styleWidth;
    canvasContainer.style.height = styleHeight;
    canvas.style.width = styleWidth;
    canvas.style.height = styleHeight;
    overlayCanvas.style.width = styleWidth;
    overlayCanvas.style.height = styleHeight;
    centerCanvas();

    const widthOverflow = newWidth > innerWidth && innerWidth > parsedWidth;
    const heightOverflow = newHeight > innerHeight && innerHeight > parsedHeight;
    if (!widthOverflow && !heightOverflow) window.scrollBy(dx, dy);
}
