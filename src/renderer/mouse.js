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

export function zoom(dir, mousePos) {
    const sign = dir ? 1 : -1;

    const zoomStep = 2;
    const zoomNum = 3
    const maxScale = zoomStep ** zoomNum;
    const minScale = 1 / maxScale;
    const scale = zoomStep ** sign;

    const initWidth = parseInt(canvas.width || 0);
    const initHeight = parseInt(canvas.height || 0);
    const eltWidth = parseInt(canvas.style.width || initWidth);
    const eltHeight = parseInt(canvas.style.height || initHeight);
    const { scrollX, scrollY, innerWidth, innerHeight } = window;
    const [mx, my] = mousePos ?? [];

    const widthScale = eltWidth / initWidth;
    const heightScale = eltHeight / initHeight;
    const newWidthScale = clamp(widthScale * scale, minScale, maxScale);
    const newHeightScale = clamp(heightScale * scale, minScale, maxScale);
    const newWidth = initWidth * newWidthScale;
    const newHeight = initHeight * newHeightScale;

    const centerX = scrollX + innerWidth / 2;
    const centerY = scrollY + innerHeight / 2;
    const tx = mx == null ? centerX : mx * widthScale;
    const ty = my == null ? centerY : my * heightScale;
    const dx = (centerX + tx) / 2 - eltWidth / 2;
    const dy = (centerY + ty) / 2 - eltHeight / 2;

    if (newWidthScale === widthScale || !newWidth) return;
    if (newHeightScale === heightScale || !newHeight) return;

    const styleWidth = `${Math.floor(newWidth)}px`;
    const styleHeight = `${Math.floor(newHeight)}px`;
    canvasContainer.style.width = styleWidth;
    canvasContainer.style.height = styleHeight;
    canvas.style.width = styleWidth;
    canvas.style.height = styleHeight;
    overlayCanvas.style.width = styleWidth;
    overlayCanvas.style.height = styleHeight;

    centerCanvas();
    const widthOverflow = newWidth > innerWidth && innerWidth > eltWidth;
    const heightOverflow = newHeight > innerHeight && innerHeight > eltHeight;
    if (widthOverflow || heightOverflow) return;
    window.scrollBy(dx * newWidth / eltWidth, dy * newHeight / eltHeight);
}
