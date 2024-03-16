import { clamp } from "../terminal/index.js";
import { fitRectToCanvas } from "./rect.js";

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
    const { x, y, s: k } = state;
    const style = `translate(-50%, -50%) translate(${-x}px, ${-y}px) scale(${k})`;
    canvas.style.transform = overlayCanvas.style.transform = style;
}

export function getScroll() {
    const { x, y } = state;
    return [x, y];
}

export function setScroll(x, y) {
    const { innerWidth, innerHeight } = window;
    const lw = canvas.width * state.s / 2 + innerWidth / 2 - 1;
    const lh = canvas.height * state.s / 2 + innerHeight / 2 - 1;
    state.x = clamp(x, -lw, lw);
    state.y = clamp(y, -lh, lh);
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

export function zoom(dir, mousePos) {
    const step = 2;
    const limit = 3;

    const scale = getScale();
    const newScale = clamp(
        scale * step ** (dir ? 1 : -1),
        step ** -limit,
        step ** limit
    );

    if (newScale === scale) return;

    setScale(newScale);

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
    const w = window.innerWidth / canvas.width;
    const h = window.innerHeight / canvas.height;
    setScale(Math.min(w, h));
    setScroll(0, 0);
}
