import { canvas, loadImageOnCanvas } from "./canvas.js";
import mouse from "./mouse.js";
import { fitRectToCanvas } from "./rect.js";
import { closeScrapModal, getScrapModalLines, openScrapeModal, scrapeModal, writeScrapModalLines } from "./scrapeModal.js";

export const mainShortcuts = [
    ['i', 'Import', async () => {
        try {
            const dataURL = await window.electron.import();
            if (!dataURL) return;
            await loadImageOnCanvas(dataURL);
            window.electron.status('Import: DONE');
        } catch (error) {
            console.error(error);
            window.electron.status('Import: ERROR');
        }
    }],
    ['p', 'Paste', async () => {
        try {
            const dataURL = await window.electron.paste();
            if (!dataURL) return;
            await loadImageOnCanvas(dataURL);
            window.electron.status('Paste: DONE');
        } catch (error) {
            console.error(error);
            window.electron.status('Paste: ERROR');
        }
    }],
    ['escape', 'Open scrape', () => {
        if (mouse.isHold) {
            mouse.isHold = false;
            fitRectToCanvas();
        } else {
            openScrapeModal();
            remindShortcuts();
        }
    }],
    ['s', 'Save', () => {
        const dataURL = canvas.toDataURL('image/png');
        window.electron.saveCanvas(dataURL);
    }],
    ['enter', 'Scrape tesseract', async () => {
        const dataURL = canvas.toDataURL('image/png');
        window.electron.scrapeTesseract(dataURL);
    }]
];

export const modalShortcuts = [
    ['enter', 'Clean and scrape', () => {
        const cleanedLines = unique(getScrapModalLines().map(extractUsername));
        if (!cleanedLines.length) return window.electron.status("Scrape: EMPTY");
        writeScrapModalLines(cleanedLines);
        window.electron.scrape(getScrapModalLines());
    }],
    ['escape', 'Close scrape', () => {
        closeScrapModal();
    }]
];

export const getActiveShortcuts = () => {
    return scrapeModal.isOpen ? modalShortcuts : mainShortcuts
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
    const shortcut = shortcuts.find(([k]) => [key, codeKey].includes(k))
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
