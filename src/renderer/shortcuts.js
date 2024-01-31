import shortcutsMain from "./shortcutsMain.js";
import shortcutsTerminal from "./shortcutsTerminal.js";
import { terminal } from "./terminal.js";

export const getActiveShortcuts = () => {
    return terminal.isOpen ? shortcutsTerminal : shortcutsMain
}

export function onKeyDown(e) {
    const filteredShortcuts = getActiveShortcuts().filter(([shortcutKeyString]) => {
        const [key, mods] = parseShortcut(shortcutKeyString);
        const eventKey = e.key.toLowerCase();
        const eventCode = String.fromCharCode(e.keyCode || e.which).toLowerCase();

        return modifierMatches(mods, e) && [eventKey, eventCode].includes(key);
    })
    if (!filteredShortcuts.length) return;

    e.preventDefault();
    filteredShortcuts.forEach(shortcut => {
        window.electron.status(`Used ${formatShortcut(shortcut)}`);
        const [_key, _name, callback] = shortcut;
        callback(e);
    })
}

function modifierMatches(mods, event) {
    mods = Array.from(new Set(mods));

    const allowedMods = ['ctrl', 'shift', 'alt', 'meta'];
    if (!mods.every(mod => allowedMods.includes(mod))) return false;

    const eventMods = allowedMods.filter(mod => event[`${mod}Key`]);
    if (mods.length !== eventMods.length) return;
    return eventMods.every(mod => mods.includes(mod));
}

function parseShortcut(str) {
    const parts = str.toLowerCase().split('+');
    const key = parts[parts.length - 1];
    const mods = parts.slice(0, parts.length - 1);
    return [key, mods];
}

export function formatShortcut(shortcut) {
    const [key, name] = shortcut;
    return `"${key}" - ${name}`;
}

export function remindShortcuts() {
    const shortcuts = getActiveShortcuts();
    window.electron.status('Shortcuts:', shortcuts.map(formatShortcut));
}
