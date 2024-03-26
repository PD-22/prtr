import * as terminal from "../terminal/index.js";
import { drawImage, loadImage, reset, scrollBy, zoom } from "./canvas.js";
import { mouseDrag, mouseSelect } from "./mouse.js";
import { fitRectToCanvas, getRectCanvasDataURL, toggleDrag } from "./rect.js";
import { modifierMatches } from "./shortcuts.js";
import * as c from "./cancelable.js";

const MAIN = 'MAIN';
const cancelable = p => c.cancelable(MAIN, p);
const cancelList = () => c.cancelList(MAIN);

let pending = false;

export default [
    ['Escape', 'Cancel', () => cancelList() || fitRectToCanvas()],
    action('KeyI', 'Import', async () => {
        const filePath = await api.importDialog();
        if (!filePath) return api.status('Import: Cancel');

        api.status('Import: START');
        const [cancelImport, dataURL] = await cancelable(api.importFile(filePath));
        if (cancelImport) return api.status('Import: Cancel');
        if (!dataURL) throw new Error('File Read fail');

        const [cancelLoad, image] = await cancelable(loadImage(dataURL));
        if (cancelLoad) return api.status('Import: Cancel');

        drawImage(image);
        api.status('Import: DONE');
    }),
    action('KeyE', 'Export', async () => {
        const dataURL = getRectCanvasDataURL();
        if (!dataURL) return api.status('Export: EMPTY');

        const filePath = await api.exportDialog();
        if (!filePath) return api.status('Export: CANCEL');

        api.status('Export: START');
        await api.exportFile(filePath, dataURL);
        api.status('Export: DONE', [filePath]);
    }),
    action('KeyP', 'Paste', async () => {
        api.status('Paste: START');
        const dataURL = await api.paste();
        if (!dataURL) return api.status('Paste: CANCEL');

        const [cancelLoad, image] = await cancelable(loadImage(dataURL));
        if (cancelLoad) return api.status('Paste: Cancel');

        drawImage(image);
        api.status('Paste: DONE');
    }),
    action('KeyC', 'Crop', async () => {
        api.status('Crop: START');
        const dataURL = getRectCanvasDataURL();
        if (!dataURL) return api.status('Crop: CANCEL');

        const [cancelLoad, image] = await cancelable(loadImage(dataURL));
        if (cancelLoad) return api.status('Crop: Cancel');

        drawImage(image);
        api.status('Crop: DONE');
    }),
    action('Enter', 'Recognize', async () => {
        const dataURL = getRectCanvasDataURL();
        if (!dataURL) return api.status('Recognize: EMPTY');

        const [cancel, parsedLines] = await cancelable(api.recognize(dataURL));
        if (cancel) return api.status('Recognize: Cancel');
        if (!parsedLines?.length) return api.status('Recognize: EMPTY');

        terminal.writeText(parsedLines.join('\n'), null, null, true);
        terminal.open();
        api.status('Recognize: DONE');
    }),

    [mouseDrag.input, 'Move'],
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
    ['Ctrl+Digit0', 'Fit', () => reset()],

    [[mouseSelect.input, 'Space'], 'Select', () => { toggleDrag() }],
];

function action(input, name, acb) {
    const status = rest => api.status(`${name}: ${rest}`);
    const callback = async () => {
        if (pending) return status(`Pending: ${pending}`);
        try {
            pending = name;
            await acb();
        } catch (error) {
            status('ERROR');
            throw error;
        } finally {
            pending = false;
        }
    };
    return [input, name, callback];
}
