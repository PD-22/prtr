import * as terminal from "../terminal/index.js";
import createCancelable from "./cancelable.js";
import { drawImage, loadImage, reset, scrollBy, zoom } from "./canvas.js";
import { fitRectToCanvas, getRectCanvasDataURL, toggleDrag } from "./rect.js";
import { cancelScrape } from "./scrape.js";
import { modifierMatches } from "./shortcuts.js";

const [_cancelable, cancel] = createCancelable();
const cancelable = (...a) => _cancelable(a);

let pending = false;

export default [
    ['Escape', 'Esc', 'Cancel', () => cancel() || fitRectToCanvas()],
    action('Enter', 'Enter', 'Scan', async (dataURL) => {
        const [cancel, parsedLines] = await cancelable(api.recognize(dataURL));
        if (cancel) return;
        if (!parsedLines?.length) throw new Error('Empty');

        cancelScrape();
        terminal.writeText(parsedLines.join('\n'), undefined, undefined, true);
        terminal.open();
    }, getRectCanvasDataURL),
    action('KeyP', 'P', 'Paste', async () => {
        const dataURL = await api.paste();
        if (!dataURL) return;

        const [cancelLoad, image] = await cancelable(loadImage(dataURL));
        if (cancelLoad) return;

        drawImage(image);
    }),
    action('KeyI', 'I', 'Import', async () => {
        const filePath = await api.importDialog();
        if (!filePath) return;

        const [cancelImport, dataURL] = await cancelable(api.importFile(filePath));
        if (cancelImport) return;
        if (!dataURL) throw new Error('Empty');

        const [cancelLoad, image] = await cancelable(loadImage(dataURL));
        if (cancelLoad) return;

        drawImage(image);
    }),
    action('KeyE', null, null, async (dataURL) => {
        const filePath = await api.exportDialog();
        if (!filePath) return;

        await api.exportFile(filePath, dataURL);
    }, getRectCanvasDataURL),

    action('KeyC', null, null, async () => {
        const dataURL = getRectCanvasDataURL();
        if (!dataURL) return;

        const [cancelLoad, image] = await cancelable(loadImage(dataURL));
        if (cancelLoad) return;

        drawImage(image);
    }),

    [null, 'RightMouse, Arrows', 'Move'],
    ...['Up', 'Right', 'Down', 'Left'].map(dir => {
        const inputs = [null, 'Ctrl', 'Shift'].map(mod => [mod, `Arrow${dir}`].filter(Boolean).join('+'));
        const callback = e => {
            const _ = m => modifierMatches([m], e);
            const amount = _('Ctrl') ? 1 : _('Shift') ? 100 : 10;
            const x = (({ 'Right': 1, 'Left': -1 })[dir] ?? 0) * amount;
            const y = (({ 'Down': 1, 'Up': -1 })[dir] ?? 0) * amount;
            scrollBy(x, y);
        };
        return [inputs, null, null, callback];
    }),

    [null, 'MouseWheel, +/-', 'Zoom'],
    ['Equal', null, null, () => zoom(true)],
    ['Minus', null, null, () => zoom(false)],
    ['Digit0', null, null, () => reset()],
    
    ['Space', 'LeftMouse, Space', 'Select', () => { toggleDrag() }],
];

const actionId = 'action';
function action(input, displayInput, name, acb, prepare) {
    const status = (message, permanent) => api.status(message, undefined, permanent, actionId);
    const callback = async () => {
        const args = prepare?.();
        if (pending || prepare && !args) return;
        try {
            status(`${pending = name}...`, true);
            await acb(args);
            status();
        } catch (error) {
            status(`${name}: Error`);
            throw error;
        } finally {
            pending = false;
        }
    };
    return [input, displayInput, name, callback];
}
