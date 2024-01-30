import { canvas, ctx, loadImageOnCanvas } from "./canvas.js";
import mouse from "./mouse.js";
import { fitRectToCanvas, getNormalRect, getRectCanvasDataURL, resizeCanvas } from "./rect.js";
import { remindShortcuts } from "./shortcuts.js";
import { openTerminal, terminal, writeTerminalLines } from "./terminal.js";

export default [
    ['I', 'Import', async () => {
        try {
            const dataURL = await window.electron.import();
            if (!dataURL) return;
            await loadImageOnCanvas(dataURL);
            window.electron.status('Import: DONE');
        } catch (error) {
            window.electron.status('Import: ERROR');
            throw error;
        }
    }],
    ['E', 'Export', () => {
        const dataURL = getRectCanvasDataURL();
        window.electron.export(dataURL);
    }],
    ['P', 'Paste', async () => {
        try {
            const dataURL = await window.electron.paste();
            if (!dataURL) return;
            await loadImageOnCanvas(dataURL);
            window.electron.status('Paste: DONE');
        } catch (error) {
            window.electron.status('Paste: ERROR');
            throw error;
        }
    }],
    ['C', 'Crop', async () => {
        try {
            window.electron.status('Crop: START');
            await loadImageOnCanvas(getRectCanvasDataURL());
            window.electron.status('Crop: DONE');
        } catch (error) {
            window.electron.status('Crop: ERROR');
            throw error;
        }
    }],
    ['Enter', 'Recognize', async () => {
        try {
            const dataURL = getRectCanvasDataURL();
            const parsedLines = await window.electron.recognize(dataURL);
            if (!parsedLines) return;

            writeTerminalLines(parsedLines);
            if (terminal.isOpen) return;
            openTerminal();
            remindShortcuts();
        } catch (error) {
            window.electron.status('Recognize: ERROR');
            throw error;
        }
    }],
    ['Escape', 'Terminal', () => {
        if (mouse.isHold) {
            mouse.isHold = false;
            fitRectToCanvas();
        } else if (!terminal.isOpen) {
            openTerminal();
            remindShortcuts();
        }
    }]
];
