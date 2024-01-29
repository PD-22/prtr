import { canvas, loadImageOnCanvas } from "./canvas.js";
import mouse from "./mouse.js";
import { fitRectToCanvas } from "./rect.js";
import { closeScrapModal, getScrapModalLines, openScrapeModal, scrapeModal, writeScrapModalLines } from "./scrapeModal.js";

export const mainShortcuts = {
    o: async function load() {
        const dataURL = await window.electron.loadCanvasImage();
        if (dataURL) return loadImageOnCanvas(dataURL);
    },
    v: async function paste() {
        const dataURL = await window.electron.getClipboardImage();
        if (dataURL) return loadImageOnCanvas(dataURL);
    },
    escape: function openScrape() {
        if (mouse.isHold) {
            mouse.isHold = false;
            fitRectToCanvas();
        } else {
            openScrapeModal();
            window.electron.status(formatShortcutDict(mainShortcuts));
        }
    },
    s: function save() {
        const dataURL = canvas.toDataURL('image/png');
        window.electron.saveCanvas(dataURL);
    },
    enter: async function scrapeTesseract() {
        const dataURL = canvas.toDataURL('image/png');
        window.electron.scrapeTesseract(dataURL);
    }
};

export const modalShortcuts = {
    enter: function cleanAndScrape() {
        const cleanedLines = unique(getScrapModalLines().map(extractUsername));
        if (!cleanedLines.length) return window.electron.status("Scrape: EMPTY");
        writeScrapModalLines(cleanedLines);
        window.electron.scrape(getScrapModalLines());
    },
    escape: function closeScrape() { closeScrapModal(); }
};

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
    const shortcuts = scrapeModal.isOpen ? modalShortcuts : mainShortcuts;
    const key = e.key.toLowerCase();
    const codeKey = String.fromCharCode(e.keyCode || e.which).toLowerCase();
    const shortcut = shortcuts[key] || shortcuts[codeKey];
    if (!shortcut) return;
    e.preventDefault();
    window.electron.status(`Used ${formatShortcut(key, shortcut)}`);
    shortcut(e);
}

export function formatShortcut(key, fn) {
    return `"${key}" - ${fn.name}`;
}

export function formatShortcutDict(shortcuts) {
    const lines = Object
        .entries(shortcuts)
        .map(([k, fn]) => formatShortcut(k, fn));
    return `Shortcuts:\n${lines.join('\n')}`;
}
