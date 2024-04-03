import * as terminal from "../terminal/index.js";
import createCancelable from "./cancelable.js";
import { drawImage, loadImage, reset, scrollBy, zoom } from "./canvas.js";
import { mouseDrag, mouseSelect, mouseZoom } from "./mouse.js";
import { fitRectToCanvas, getRectCanvasDataURL, toggleDrag } from "./rect.js";
import { cancelScrape } from "./scrape.js";
import { modifierMatches } from "./shortcuts.js";

const [_cancelable, cancel] = createCancelable();
const cancelable = (...a) => _cancelable(a);

let pending = false;

export default [
    action('KeyI', 'Import', async () => {
        const filePath = await api.importDialog();
        if (!filePath) return 'Cancel';

        const [cancelImport, dataURL] = await cancelable(api.importFile(filePath));
        if (cancelImport) return 'Cancel';
        if (!dataURL) throw new Error('File Read fail');

        const [cancelLoad, image] = await cancelable(loadImage(dataURL));
        if (cancelLoad) return 'Cancel';

        drawImage(image);
    }),
    action('KeyE', 'Export', async () => {
        const dataURL = getRectCanvasDataURL();
        if (!dataURL) return 'Empty';

        const filePath = await api.exportDialog();
        if (!filePath) return 'Cancel';

        await api.exportFile(filePath, dataURL);
        // status('Done', [filePath]);
    }),
    action('KeyP', 'Paste', async () => {
        const dataURL = await api.paste();
        if (!dataURL) return 'Cancel';

        const [cancelLoad, image] = await cancelable(loadImage(dataURL));
        if (cancelLoad) return 'Cancel';

        drawImage(image);
    }),
    action('KeyC', 'Crop', async () => {
        const dataURL = getRectCanvasDataURL();
        if (!dataURL) return 'Cancel';

        const [cancelLoad, image] = await cancelable(loadImage(dataURL));
        if (cancelLoad) return 'Cancel';

        drawImage(image);
    }),
    action('Enter', 'Recognize', async () => {
        const dataURL = getRectCanvasDataURL();
        if (!dataURL) return 'Empty';

        const [cancel, parsedLines] = await cancelable(api.recognize(dataURL));
        if (cancel) return 'Cancel';
        if (!parsedLines?.length) return 'Empty';

        cancelScrape();
        terminal.writeText(parsedLines.join('\n'), null, null, true);
        terminal.open();
        // status('Done', terminal.getLines());
    }),

    [mouseDrag.input, 'Move'],
    [[mouseSelect.input, 'Space'], 'Select', () => { toggleDrag() }],
    [[mouseZoom.in.input, 'Ctrl+Equal'], 'Magnify', () => zoom(true)],
    [[mouseZoom.out.input, 'Ctrl+Minus'], 'Minify', () => zoom(false)],
    ['Ctrl+Digit0', 'Fit', () => reset()],

    ...['Up', 'Right', 'Down', 'Left'].map(dir => {
        const inputs = [null, 'Ctrl', 'Shift'].map(mod => [mod, `Arrow${dir}`].filter(Boolean).join('+'));
        const callback = e => {
            const _ = m => modifierMatches([m], e);
            const amount = _('Ctrl') ? 1 : _('Shift') ? 100 : 10;
            const x = (({ 'Right': 1, 'Left': -1 })[dir] ?? 0) * amount;
            const y = (({ 'Down': 1, 'Up': -1 })[dir] ?? 0) * amount;
            scrollBy(x, y);
        };
        return [inputs, null, callback];
    }),
    ['Escape', 'Cancel', () => cancel() || fitRectToCanvas()],
];

const actionId = 'action';
function action(input, name, acb) {
    const status = (message, ...rest) => api.status(`${name}: ${message}`, ...rest);
    const statusPending = () => status(`${name === pending ? '' : `${pending} `}pending`);
    const callback = async () => {
        if (pending) return statusPending();
        try {
            api.status(`${name}...`, undefined, true, actionId);
            pending = name;
            const result = await acb(status);
            status(result ?? 'Done', undefined, undefined, actionId);
        } catch (error) {
            status('Error');
            throw error;
        } finally {
            pending = false;
        }
    };
    return [input, name, callback];
}
