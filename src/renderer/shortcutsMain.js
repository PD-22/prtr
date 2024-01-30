import { canvas, loadImageOnCanvas } from "./canvas.js";
import mouse from "./mouse.js";
import { fitRectToCanvas } from "./rect.js";
import { remindShortcuts } from "./shortcuts.js";
import { openTerminal, terminal, writeTerminalLines } from "./terminal.js";

export default [
    ['O', 'Import', async () => {
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
    ['S', 'Export', () => {
        const dataURL = canvas.toDataURL('image/png');
        window.electron.export(dataURL);
    }],
    ['V', 'Paste', async () => {
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
    ['Enter', 'Recognize', async () => {
        try {
            const dataURL = canvas.toDataURL('image/png');
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
