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
    const scale = base ** sign;

    const canvasWidth = parseInt(canvas.width || 0);
    const canvasHeight = parseInt(canvas.height || 0);
    const parsedWidth = parseInt(canvas.style.width || canvasWidth);
    const parsedHeight = parseInt(canvas.style.height || canvasHeight);
    const scaleWidth = parsedWidth * scale / canvasWidth;
    const scaleHeight = parsedHeight * scale / canvasHeight;
    const newWidth = canvasWidth * scaleWidth;
    const newHeight = canvasHeight * scaleHeight;
    const { scrollX, scrollY } = window;
    const x = dir ?
        (scrollX + innerWidth / 2) * base - innerWidth / base :
        (scrollX + innerWidth / base) / base - innerWidth / 2;
    const y = dir ?
        (scrollY + innerHeight / 2) * base - innerHeight / base :
        (scrollY + innerHeight / base) / base - innerHeight / 2;
    if (!newWidth || !newHeight) return;

    const styleWidth = `${Math.floor(newWidth)}px`;
    const styleHeight = `${Math.floor(newHeight)}px`;
    canvasContainer.style.width = styleWidth;
    canvasContainer.style.height = styleHeight;
    canvas.style.width = styleWidth;
    canvas.style.height = styleHeight;
    overlayCanvas.style.width = styleWidth;
    overlayCanvas.style.height = styleHeight;

    const widthOverflow = newWidth > innerWidth && innerWidth > parsedWidth;
    const heightOverflow = newHeight > innerHeight && innerHeight > parsedHeight;
    if (widthOverflow || heightOverflow) return centerCanvas();

    window.scroll(x, y);
}
