import * as terminal from "../terminal/index.js";
import { loadImageOnCanvas } from "./canvas.js";
import mouse from "./mouse.js";
import { fitRectToCanvas, getRectCanvasDataURL } from "./rect.js";

export default [
    ['I', 'Import', async () => {
        try {
            const dataURL = await api.import();
            if (!dataURL) return;
            await loadImageOnCanvas(dataURL);
            api.status('Import: DONE');
        } catch (error) {
            api.status('Import: ERROR');
            throw error;
        }
    }],
    ['E', 'Export', () => {
        const dataURL = getRectCanvasDataURL();
        api.export(dataURL);
    }],
    ['P', 'Paste', async () => {
        try {
            const dataURL = await api.paste();
            if (!dataURL) return;
            await loadImageOnCanvas(dataURL);
            api.status('Paste: DONE');
        } catch (error) {
            api.status('Paste: ERROR');
            throw error;
        }
    }],
    ['C', 'Crop', async () => {
        try {
            api.status('Crop: START');
            const dataURL = getRectCanvasDataURL();
            if (!dataURL) return api.status('Crop: EMPTY');
            await loadImageOnCanvas(dataURL);
            api.status('Crop: DONE');
        } catch (error) {
            api.status('Crop: ERROR');
            throw error;
        }
    }],
    ['Enter', 'Recognize', async () => {
        try {
            const dataURL = getRectCanvasDataURL();
            if (!dataURL) return api.status('Recognize: EMPTY');
            const parsedLines = await api.recognize(dataURL);
            if (!parsedLines) return;

            terminal.writeText(parsedLines.join('\n'), null, null, true);
            if (terminal.state.isOpen) return;
            terminal.open();
        } catch (error) {
            api.status('Recognize: ERROR');
            throw error;
        }
    }],

    ['Escape', 'Deselect', () => { mouse.isHold = false; fitRectToCanvas(); }]
];
