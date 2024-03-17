import shortcutsMain from "./shortcutsMain.js";
import shortcutsTerminal from "./shortcutsTerminal.js";
import * as terminal from "../terminal/index.js";

const commonShortcuts = [
    ['Tab', 'Toggle', () => terminal.toggle()],
    ['Alt+Slash', 'Shortcuts', () => remindShortcuts()],
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

    const inputs = Array.isArray(input) ? input : [input];
    const matchedInput = inputs.find(input => shortcutMatches(e, input));
    if (!matchedInput) return;

    e.preventDefault();
    api.status(formatShortcut([matchedInput, name]));
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

export function formatShortcut(shortcut) {
    const [key, name] = shortcut;
    const keys = Array.isArray(key) ? key : [key];
    return [name, keys.join(', ')].join(' - ');
}

export function remindShortcuts() {
    const shortcuts = getActiveShortcuts();
    api.status('Shortcuts', shortcuts.map(formatShortcut));
}
