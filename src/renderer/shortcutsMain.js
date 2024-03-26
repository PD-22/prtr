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
    action('KeyI', 'Import', async status => {
        const filePath = await api.importDialog();
        if (!filePath) return status('Cancel');

        status('Start');
        const [cancelImport, dataURL] = await cancelable(api.importFile(filePath));
        if (cancelImport) return status('Cancel');
        if (!dataURL) throw new Error('File Read fail');

        const [cancelLoad, image] = await cancelable(loadImage(dataURL));
        if (cancelLoad) return status('Cancel');

        drawImage(image);
        status('Done');
    }),
    action('KeyE', 'Export', async status => {
        const dataURL = getRectCanvasDataURL();
        if (!dataURL) return status('Empty');

        const filePath = await api.exportDialog();
        if (!filePath) return status('Cancel');

        status('Start');
        await api.exportFile(filePath, dataURL);
        status('Done', [filePath]);
    }),
    action('KeyP', 'Paste', async status => {
        status('Start');
        const dataURL = await api.paste();
        if (!dataURL) return status('Cancel');

        const [cancelLoad, image] = await cancelable(loadImage(dataURL));
        if (cancelLoad) return status('Cancel');

        drawImage(image);
        status('Done');
    }),
    action('KeyC', 'Crop', async status => {
        status('Start');
        const dataURL = getRectCanvasDataURL();
        if (!dataURL) return status('Cancel');

        const [cancelLoad, image] = await cancelable(loadImage(dataURL));
        if (cancelLoad) return status('Cancel');

        drawImage(image);
        status('Done');
    }),
    action('Enter', 'Recognize', async status => {
        const dataURL = getRectCanvasDataURL();
        if (!dataURL) return status('Empty');

        const [cancel, parsedLines] = await cancelable(api.recognize(dataURL));
        if (cancel) return status('Cancel');
        if (!parsedLines?.length) return status('Empty');

        terminal.writeText(parsedLines.join('\n'), null, null, true);
        terminal.open();
        status('Done');
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
    const status = message => api.status(`${name}: ${message}`);
    const statusPending = () => status(`${name === pending ? '' : `${pending} `}pending`);
    const callback = async () => {
        if (pending) return statusPending();
        try {
            pending = name;
            await acb(status);
        } catch (error) {
            status('Error');
            throw error;
        } finally {
            pending = false;
        }
    };
    return [input, name, callback];
}
