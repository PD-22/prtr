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

const state = { x: 0, y: 0, s: 1 };

function transfrom() {
    const { x, y, s } = state;
    const style = `translate(-50%, -50%) translate(${-x}px, ${-y}px) scale(${s})`;
    canvas.style.transform = overlayCanvas.style.transform = style;
}

export function getScroll() {
    const { x, y } = state;
    return [x, y];
}

export function setScroll(x, y) {
    state.x = x;
    state.y = y;
    transfrom();
}

export function scrollBy(x, y) {
    const [x0, y0] = getScroll();
    setScroll(x0 + x, y0 + y);
}

export function getScale() {
    return state.s;
}

export function setScale(s) {
    state.s = s;
    transfrom();
}
