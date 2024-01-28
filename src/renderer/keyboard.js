import { canvas, loadImageOnCanvas } from "./canvas.js";
import mouse from "./mouse.js";
import { fitRectToCanvas } from "./rect.js";
import { openScrapeModal } from "./scrapeModal.js";

const keyboard = { shortcutsDisabled: false };
export default keyboard;

function formatShortcut(key) {
    return `"${key}" - ${shortcuts[key].name}`;
}

export function formatShortcutDict() {
    return `Shortcuts:\n${Object.keys(shortcuts).map(formatShortcut).join('\n')}`;
}

const shortcuts = {
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
    }
};

export function onKeyDown(e) {
    if (keyboard.shortcutsDisabled) return;
    if (e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) return;
    const key = e.key.toLowerCase();
    const shortcut = shortcuts[key];
    if (!shortcut) return;
    e.preventDefault();
    window.electron.status(`Shortcut ${formatShortcut(key)}`);
    shortcut();
}
