import { canvas, loadImageOnCanvas } from "./canvas.js";
import mouse from "./mouse.js";
import { fitRectToCanvas } from "./rect.js";
import { closeScrapModal, getScrapModalLines, openScrapeModal, scrapeModal, writeScrapModalLines } from "./scrapeModal.js";

export const mainShortcuts = [
    ['o', 'load', async () => {
        const dataURL = await window.electron.loadCanvasImage();
        if (dataURL) return loadImageOnCanvas(dataURL);
    }],
    ['v', 'paste', async () => {
        const dataURL = await window.electron.getClipboardImage();
        if (dataURL) return loadImageOnCanvas(dataURL);
    }],
    ['escape', 'openScrape', () => {
        if (mouse.isHold) {
            mouse.isHold = false;
            fitRectToCanvas();
        } else {
            openScrapeModal();
            remindShortcuts();
        }
    }],
    ['s', 'save', () => {
        const dataURL = canvas.toDataURL('image/png');
        window.electron.saveCanvas(dataURL);
    }],
    ['enter', 'scrapeTesseract', async () => {
        const dataURL = canvas.toDataURL('image/png');
        window.electron.scrapeTesseract(dataURL);
    }]
];

export const modalShortcuts = [
    ['enter', 'cleanAndScrape', () => {
        const cleanedLines = unique(getScrapModalLines().map(extractUsername));
        if (!cleanedLines.length) return window.electron.status("Scrape: EMPTY");
        writeScrapModalLines(cleanedLines);
        window.electron.scrape(getScrapModalLines());
    }],
    ['escape', 'closeScrape', () => {
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

export function formatShortcutList(shortcuts) {
    const lines = shortcuts.map(formatShortcut);
    return `Shortcuts:\n${lines.map(x => `${' '.repeat(2)}${x}`).join('\n')}`;
}

export function remindShortcuts() {
    window.electron.status(formatShortcutList(getActiveShortcuts()));
}
