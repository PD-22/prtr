export const canvasBackground = document.querySelector('.canvas-background');
/** @type {HTMLCanvasElement} */
export const canvas = document.querySelector('.main-canvas');
export const ctx = canvas.getContext('2d');

/** @type {HTMLCanvasElement} */
export const overlayCanvas = document.querySelector('.overlay-canvas');
export const octx = overlayCanvas.getContext('2d');
export const clearOverlay = () => octx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
