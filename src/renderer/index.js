import * as terminal from "../terminal/index.js";
import { mouseListeners } from "./mouse.js";
import note from "./note.js";
import { onKeyDown } from "./shortcuts.js";

document.addEventListener('keydown', onKeyDown);

terminal.element.addEventListener('input', terminal.onInput);

mouseListeners.forEach(([t, l]) => window.addEventListener(t, l));

api.onStatus((message, body = []) => {
    const text = [message, ...body.map(s => '  ' + s)].join('\n');
    console.log(text);
    const noteMessage = message === 'Shortcuts' ? text : message;
    note(noteMessage, 7000, 3000);
});
