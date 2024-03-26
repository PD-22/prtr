import shortcutsMain from "./shortcutsMain.js";
import shortcutsTerminal from "./shortcutsTerminal.js";
import * as terminal from "../terminal/index.js";

export const SHORTCUTS = 'Shortcuts';
const commonShortcuts = [
    ['Tab', 'Toggle', () => terminal.toggle()],
    ['Alt+Slash', SHORTCUTS, () => remindShortcuts()],
    [['Ctrl+Digit0', 'Ctrl+Minus', 'Ctrl+Equal'], null, e => e.preventDefault()],
]

export const getActiveShortcuts = () => {
    const openShortcuts = terminal.state.isOpen ? shortcutsTerminal : shortcutsMain;
    return commonShortcuts.concat(openShortcuts);
}

export function onKeyDown(e) {
    getActiveShortcuts().forEach(s => handleShortcut(e, s));
}

function handleShortcut(e, shortcut) {
    const [input, name, callback] = shortcut;
    if (typeof callback !== "function") return;

    const inputs = Array.isArray(input) ? input : [input];
    const matchedInput = inputs.find(input => shortcutMatches(e, input));
    if (!matchedInput) return;

    e.preventDefault();
    if (name) api.status(`"${matchedInput}" - ${name}`);
    callback(e, matchedInput);
}

function shortcutMatches(e, str) {
    const [key, mods] = parseShortcut(str);
    return modifierMatches(mods, e) && e.code === key;
}

export function modifierMatches(mods, event) {
    mods = Array.from(new Set(mods.map(x => x.toLowerCase())));

    const allowedMods = ['ctrl', 'shift', 'alt', 'meta'];
    if (!mods.every(mod => allowedMods.includes(mod))) return false;

    const eventMods = allowedMods.filter(mod => event[`${mod}Key`]);
    if (mods.length !== eventMods.length) return;
    return eventMods.every(mod => mods.includes(mod));
}

function parseShortcut(str) {
    const parts = str.split('+');
    const key = parts[parts.length - 1];
    const mods = parts.slice(0, parts.length - 1);
    return [key, mods];
}

export function remindShortcuts() {
    const shortcuts = getActiveShortcuts();
    const f = ([key, name]) => {
        const keys = Array.isArray(key) ? key : [key];
        const fkey = keys[0]
            .replace(/\bKey([A-Z])$/, '$1')
            .replace(/\bDigit([0-9])$/, '$1')
            .replace(/\bArrow([A-Z][a-z]+)$/, '$1');
        return `${name} - "${fkey}"`;
    }
    api.status(SHORTCUTS, shortcuts.filter((([_, n]) => n)).map(f));
}
