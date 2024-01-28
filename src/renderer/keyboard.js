import { canvas, loadImageOnCanvas } from "./canvas.js";
import mouse from "./mouse.js";
import { fitRectToCanvas } from "./rect.js";
import { closeScrapModal, openScrapeModal, scrapeModal } from "./scrapeModal.js";

export const mainShortcuts = {
    o: async function load() {
        const dataURL = await window.electron.loadCanvasImage();
        if (dataURL) return loadImageOnCanvas(dataURL);
    },
    v: async function paste() {
        const dataURL = await window.electron.getClipboardImage();
        if (dataURL) return loadImageOnCanvas(dataURL);
    },
    escape: function cancel() {
        fitRectToCanvas();
        mouse.isHold = false;
    },
    s: function save() {
        const dataURL = canvas.toDataURL('image/png');
        window.electron.saveCanvas(dataURL);
    },
    enter: async function scrapeTesseract() {
        const dataURL = canvas.toDataURL('image/png');
        window.electron.scrapeTesseract(dataURL);
    },
    r: function openScrape() {
        openScrapeModal();
        window.electron.status(formatShortcutDict(modalShortcuts));
    }
};

export const modalShortcuts = {
    enter: function scrape() {
        const lines = scrapeModal.element.value
            .split('\n').map(x => x.trim()).filter(x => x.length);
        if (!lines.length) return;
        window.electron.scrape(lines);
        closeScrapModal();
    },
    escape: closeScrapModal
};

export const keyModifiers = ['ctrlKey', 'shiftKey', 'altKey', 'metaKey'];
export function onKeyDown(e) {
    if (keyModifiers.some(k => e[k])) return;
    const key = e.key.toLowerCase();
    const shortcuts = scrapeModal.isOpen ? modalShortcuts : mainShortcuts;
    const shortcut = shortcuts[key];
    if (!shortcut) return;
    e.preventDefault();
    window.electron.status(`Shortcut ${formatShortcut(key, shortcut)}`);
    shortcut(e);
}

export function formatShortcut(key, fn) {
    return `"${key}" - ${fn.name}`;
}

export function formatShortcutDict(shortcuts) {
    const text = Object
        .entries(shortcuts)
        .map(([k, fn]) => formatShortcut(k, fn)).join('\n');
    return `Shortcuts:\n${text}`;
}
