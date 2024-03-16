import { resizeCanvas } from "./rect.js";

export const canvasBackground = document.querySelector('.canvas-background');
export const canvasContainer = document.querySelector('.canvas-container');
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
    ctx.drawImage(image, 0, 0);
}

export function scroll(x, y) {
    const style = `translate(-50%, -50%) translate(${-x}px, ${-y}px)`;
    canvas.style.transform = style;
    overlayCanvas.style.transform = style;
}

export function scrollBy(x, y) {
    const [x0, y0] = getScroll();
    scroll(x0 + x, y0 + y);
}

export function getScroll() {
    const str = canvas.style.transform;
    const [, x, y] = str.match(/(-?\d+)px.*?(-?\d+)px/);
    return [x, y].map(v => -parseInt(v) || 0);
}
