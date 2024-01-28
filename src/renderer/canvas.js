import { fitRectToCanvas, resizeCanvas } from "./rect.js";

export const canvasBackground = document.querySelector('.canvas-background');
/** @type {HTMLCanvasElement} */
export const canvas = document.querySelector('.main-canvas');
export const ctx = canvas.getContext('2d');

/** @type {HTMLCanvasElement} */
export const overlayCanvas = document.querySelector('.overlay-canvas');
export const octx = overlayCanvas.getContext('2d');
export const clearOverlay = () => octx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

export async function loadImageOnCanvas(dataURL) {
    const image = new Image();
    image.src = dataURL;
    await new Promise(resolve => { image.onload = resolve; });

    resizeCanvas(image.width, image.height);
    fitRectToCanvas();
    ctx.drawImage(image, 0, 0);
}
