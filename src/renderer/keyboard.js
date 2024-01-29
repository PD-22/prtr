import { canvas, loadImageOnCanvas } from "./canvas.js";
import mouse from "./mouse.js";
import { fitRectToCanvas } from "./rect.js";
import { closeTerminal, getTerminalLines, openTerminal, terminal, writeTerminalLines } from "./terminal.js";

export const mainShortcuts = [
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
    ['Escape', 'Terminal', () => {
        if (mouse.isHold) {
            mouse.isHold = false;
            fitRectToCanvas();
        } else {
            openTerminal();
            remindShortcuts();
        }
    }],
    ['E', 'Export', () => {
        const dataURL = canvas.toDataURL('image/png');
        window.electron.export(dataURL);
    }],
    ['Enter', 'Recognize', async () => {
        try {
            const dataURL = canvas.toDataURL('image/png');
            const parsedLines = await window.electron.recognize(dataURL);
            if (!parsedLines) return;

            writeTerminalLines(parsedLines);
            openTerminal();
            // remindShortcuts();
        } catch (error) {
            window.electron.status('Recognize: ERROR');
            throw error;
        }
    }]
];

export const terminalShortcuts = [
    ['Enter', 'Scrape', async () => {
        try {
            const lines = unique(getTerminalLines().map(extractUsername));
            if (!lines.length) return window.electron.status("Scrape: EMPTY");
            window.electron.status('Scrape: INIT', lines);
            writeTerminalLines(lines);

            const result = await window.electron.scrape(getTerminalLines());

            writeTerminalLines(result);
            openTerminal();
            // remindShortcuts();
        } catch (error) {
            window.electron.status('Scrape: ERROR');
            throw error;
        }
    }],
    ['Escape', 'Image', () => {
        closeTerminal();
        remindShortcuts();
    }]
];

export const getActiveShortcuts = () => {
    return terminal.isOpen ? terminalShortcuts : mainShortcuts
}

export const unique = arr => Array.from(new Set(arr.filter(Boolean)));
export const whitespace = str => str.trim().replace(/\s+/g, ' ');
const extractUsername = str => {
    const match = whitespace(str).match(/(.*?)(\s+-\s+\S*)?$/)?.[1];
    if (!match) return '';
    const [first, ...rest] = match.split(' ');
    return rest.join('') || first;
}

export const keyModifiers = ['ctrlKey', 'shiftKey', 'altKey', 'metaKey'];

export function onKeyDown(e) {
    if (keyModifiers.some(m => e[m])) return;
    const shortcuts = getActiveShortcuts();
    const key = e.key.toLowerCase();
    const codeKey = String.fromCharCode(e.keyCode || e.which).toLowerCase();
    const shortcut = shortcuts.find(([sk]) => [key, codeKey].includes(sk.toLowerCase()))
    if (!shortcut) return;
    e.preventDefault();
    window.electron.status(`Used ${formatShortcut(shortcut)}`);
    const [_key, _name, callback] = shortcut;
    callback(e);
}

export function formatShortcut(shortcut) {
    const [key, name] = shortcut;
    return `"${key}" - ${name}`;
}

export function remindShortcuts() {
    const shortcuts = getActiveShortcuts();
    window.electron.status('Shortcuts:', shortcuts.map(formatShortcut));
}
