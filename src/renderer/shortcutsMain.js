import * as terminal from "../terminal/index.js";
import { loadImageOnCanvas, reset, scrollBy, zoom } from "./canvas.js";
import { fitRectToCanvas, getRectCanvasDataURL, toggleDrag } from "./rect.js";
import { modifierMatches } from "./shortcuts.js";

export default [
    ['KeyI', 'Import', async () => {
        try {
            api.status('Import: START');
            const dataURL = await api.import();
            if (!dataURL) return api.status('Import: CANCEL');

            await loadImageOnCanvas(dataURL);
            api.status('Import: DONE');
        } catch (error) {
            api.status('Import: ERROR');
            throw error;
        }
    }],
    ['KeyE', 'Export', async () => {
        try {
            api.status('Export: START');
            const dataURL = getRectCanvasDataURL();
            if (!dataURL) return api.status('Export: EMPTY');

            const filePath = await api.export(dataURL);
            if (!filePath) return api.status('Export: CANCEL');

            api.status('Export: DONE', filePath);
        } catch (error) {
            api.status('Export: ERROR');
            throw error;
        }
    }],
    ['KeyP', 'Paste', async () => {
        try {
            api.status('Paste: START');
            const dataURL = await api.paste();
            if (!dataURL) return api.status('Paste: CANCEL');

            await loadImageOnCanvas(dataURL);
            api.status('Paste: DONE');
        } catch (error) {
            api.status('Paste: ERROR');
            throw error;
        }
    }],
    ['KeyC', 'Crop', async () => {
        try {
            api.status('Crop: START');
            const dataURL = getRectCanvasDataURL();
            if (!dataURL) return api.status('Crop: CANCEL');

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
            if (!parsedLines?.length) return api.status('Recognize: CANCEL');

            terminal.writeText(parsedLines.join('\n'), null, null, true);
            terminal.open();
            api.status('Recognize: DONE');
        } catch (error) {
            api.status('Recognize: ERROR');
            throw error;
        }
    }],

    ...['Up', 'Right', 'Down', 'Left'].map(dir => {
        const inputs = [null, 'Ctrl', 'Shift'].map(mod => [mod, `Arrow${dir}`].filter(Boolean).join('+'));
        const callback = e => {
            const _ = m => modifierMatches([m], e);
            const amount = _('Ctrl') ? 1 : _('Shift') ? 100 : 10;
            const x = (({ 'Right': 1, 'Left': -1 })[dir] ?? 0) * amount;
            const y = (({ 'Down': 1, 'Up': -1 })[dir] ?? 0) * amount;
            scrollBy(x, y);
        };
        return [inputs, dir, callback];
    }),
    ['Ctrl+Equal', 'Magnify', () => zoom(true)],
    ['Ctrl+Minus', 'Minify', () => zoom(false)],
    ['Ctrl+Digit0', 'fit', () => reset()],

    ['Space', 'Select', () => { toggleDrag() }],
    ['Escape', 'Deselect', () => { fitRectToCanvas(); }],
];
