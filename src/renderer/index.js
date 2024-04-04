import * as terminal from "../terminal/index.js";
import { mouseListeners } from "./mouse.js";
import note from "./note.js";
import { onKeyDown } from "./shortcuts.js";

try {
    document.addEventListener('keydown', onKeyDown);
    terminal.element.addEventListener('input', terminal.onInput);
    mouseListeners.forEach(([t, l]) => window.addEventListener(t, l));

    api.onStatus((message, body = [], permanent, id, alive) => {
        const lines = message ? body.map(s => '  ' + s) : body;
        const text = [message, ...lines].filter(Boolean).join('\n');
        if (text) console.log(text);
        note(message ?? text, permanent ? Infinity : alive, id);
    })
} catch (error) {
    note('Error', Infinity);
    throw error;
}
