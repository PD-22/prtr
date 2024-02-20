import { loadImageOnCanvas } from "./canvas.js";
import mouse from "./mouse.js";
import { fitRectToCanvas, getRectCanvasDataURL } from "./rect.js";
import { remindShortcuts } from "./shortcuts.js";
import { openTerminal, terminal, writeTerminalText } from "./terminal.js";

export default [
    ['Alt+/', 'Shortcuts', () => remindShortcuts()],
    ['Tab', 'Terminal', () => openTerminal()],
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
    ['D', 'Deselect', () => {
        mouse.isHold = false;
        fitRectToCanvas();
    }],
    ['Enter', 'Recognize', async () => {
        try {
            const dataURL = getRectCanvasDataURL();
            if (!dataURL) return window.electron.status('Recognize: EMPTY');
            const parsedLines = await window.electron.recognize(dataURL);
            if (!parsedLines) return;

            writeTerminalText(parsedLines.join('\n'));
            if (terminal.isOpen) return;
            openTerminal();
        } catch (error) {
            window.electron.status('Recognize: ERROR');
            throw error;
        }
    }],
    ['Escape', 'Deselect', () => { mouse.isHold = false; fitRectToCanvas(); }]
];
