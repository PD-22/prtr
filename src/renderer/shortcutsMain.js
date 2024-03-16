import * as terminal from "../terminal/index.js";
import { loadImageOnCanvas, scrollBy } from "./canvas.js";
import mouse, { zoom } from "./mouse.js";
import { fitRectToCanvas, getRectCanvasDataURL } from "./rect.js";
import { modifierMatches } from "./shortcuts.js";

export default [
    ['I', 'Import', async () => {
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
    ['E', 'Export', async () => {
        try {
            api.status('Export: START');
            const dataURL = getRectCanvasDataURL();
            if (!dataURL) return api.status('Export: EMPTY');

            const filePath = await api.export(dataURL);
            if (!filePath) return api.status('Export: CANCEL');

            api.status(`Export: DONE: "${filePath}"`);
        } catch (error) {
            api.status('Export: ERROR');
            throw error;
        }
    }],
    ['P', 'Paste', async () => {
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
    ['C', 'Crop', async () => {
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
            if (!parsedLines) return api.status('Recognize: CANCEL');;

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
    ['Ctrl+=', 'Magnify', () => zoom(true)],
    ['Ctrl+-', 'Minify', () => zoom(false)],

    ['Escape', 'Deselect', () => { mouse.isHold = false; fitRectToCanvas(); }]
];
