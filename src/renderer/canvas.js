import { clamp } from "../terminal/index.js";
import note from "./note.js";
import { fitRectToCanvas, scrollToggle } from "./rect.js";

export const canvasBackground = document.querySelector('.canvas-background');
export const canvasContainer = document.querySelector('.canvas-container');
/** @type {HTMLCanvasElement} */
export const canvas = document.querySelector('.main-canvas');
export const ctx = canvas.getContext('2d');

/** @type {HTMLCanvasElement} */
export const overlayCanvas = document.querySelector('.overlay-canvas');
export const octx = overlayCanvas.getContext('2d');
export const clearOverlay = () => octx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

/** @return {Promise<HTMLImageElement} */
export async function loadImage(dataURL) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = error => reject(error);
        image.src = dataURL;
    });
}
/** @param {HTMLImageElement} image */
export function drawImage(image) {
    resizeCanvas(image.width, image.height);
    ctx.drawImage(image, 0, 0);
}

const state = { x: 0, y: 0, z: 1 };
resizeCanvas(0, 0);

function transfrom() {
    const { x, y } = state;
    const s = getScale();
    const style = `translate(-50%, -50%) translate(${-x}px, ${-y}px) scale(${s})`;
    canvas.style.transform = overlayCanvas.style.transform = style;
}

export function getScroll() {
    const { x, y } = state;
    return [x, y];
}

export function setScroll(x, y) {
    const { innerWidth, innerHeight } = window;
    const s = getScale();
    const lw = canvas.width * s / 2 + innerWidth / 2 - 1;
    const lh = canvas.height * s / 2 + innerHeight / 2 - 1;
    state.x = clamp(x, -lw, lw);
    state.y = clamp(y, -lh, lh);
    scrollToggle(x, y);
    transfrom();
}

export function scrollBy(x, y) {
    const [x0, y0] = getScroll();
    setScroll(x0 + x, y0 + y);
}

export function getScale(z = state.z) {
    return 2 ** (z / 3);
}

function setZoom(z) {
    z = clamp(z, -6, 6);
    if (z === state.z) return false;
    state.z = z;
    transfrom();
}

export function zoom(dir, mousePos) {
    const scale = getScale();
    if (setZoom(state.z + (dir ? 1 : -1)) === false) return;
    const newScale = getScale();

    const sr = newScale / scale;
    const [x, y] = getScroll();
    setScroll(x * sr, y * sr);

    if (!mousePos) return;
    const mx = mousePos[0] - canvas.width / 2;
    const my = mousePos[1] - canvas.height / 2;
    const sd = newScale - scale;
    setScroll(x + mx * sd, y + my * sd);
}

export function resizeCanvas(w, h) {
    canvas.width = overlayCanvas.width = w;
    canvas.height = overlayCanvas.height = h;
    fitRectToCanvas();
    reset();
}

export function reset() {
    setZoom(0);
    setScroll(0, 0);
}
