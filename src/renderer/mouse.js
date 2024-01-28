import { canvas, ctx, overlayCanvas } from "./canvas.js";
import { fitRectToCanvas, getNormalRect, resizeCanvas, setRectEnd, setRectStart } from "./rect.js";

const mouse = { isHold: false };
export default mouse;

function cropCanvas() {
    const { x, y, w, h } = getNormalRect();
    if (w < 1 || h < 1) return fitRectToCanvas();

    const tempCanvas = document.createElement('canvas');
    const tctx = tempCanvas.getContext('2d');
    tempCanvas.width = w;
    tempCanvas.height = h;
    tctx.drawImage(canvas, x, y, w, h, 0, 0, w, h);

    resizeCanvas(w, h);
    fitRectToCanvas();
    ctx.drawImage(tempCanvas, 0, 0);
}

function getCanvasMousePos(e) {
    const bcr = overlayCanvas.getBoundingClientRect();

    const scaleX = overlayCanvas.width / bcr.width;
    const scaleY = overlayCanvas.height / bcr.height;

    const x = Math.min(overlayCanvas.width, Math.max(0, (e.clientX - bcr.left) * scaleX));
    const y = Math.min(overlayCanvas.height, Math.max(0, (e.clientY - bcr.top) * scaleY));

    return [x, y];
}

export function onMouseDown(e) {
    mouse.isHold = true;
    const [x, y] = getCanvasMousePos(e);
    setRectStart(x, y);
}

export function onMouseMove(e) {
    if (!mouse.isHold) return;
    const [x, y] = getCanvasMousePos(e);
    setRectEnd(x, y);
}

export function onMouseUp(e) {
    if (!mouse.isHold) return;
    mouse.isHold = false;
    const [x, y] = getCanvasMousePos(e);
    setRectEnd(x, y);
    cropCanvas();
}
