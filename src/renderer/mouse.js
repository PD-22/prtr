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

    ['width', 'height'].forEach(dimension => {
        const canvasSize = parseInt(canvas[dimension] || 0);
        const parsedSize = parseInt(canvas.style[dimension] || canvasSize);

        const scale = parsedSize * 2 ** -Math.sign(e.deltaY) / canvasSize;
        const newSize = Math.floor(canvasSize * clamp(scale, 1 / 8, 8));
        if (!newSize) return;

        const style = `${newSize}px`;
        canvasContainer.style[dimension] = style;
        canvas.style[dimension] = style;
        overlayCanvas.style[dimension] = style;
    });

    centerCanvas();
}
