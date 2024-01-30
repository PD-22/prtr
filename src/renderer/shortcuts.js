import shortcutsMain from "./shortcutsMain.js";
import shortcutsTerminal from "./shortcutsTerminal.js";
import { terminal } from "./terminal.js";

export const getActiveShortcuts = () => {
    return terminal.isOpen ? shortcutsTerminal : shortcutsMain
}

export const unique = arr => Array.from(new Set(arr.filter(Boolean)));
export const whitespace = str => str.trim().replace(/\s+/g, ' ');
export const extractUsername = str => {
    const match = whitespace(str).match(/(.*?)(\s+-\s+\S*)?$/)?.[1];
    if (!match) return '';
    const [first, ...rest] = match.split(' ');
    return rest.join('') || first;
}

export const keyModifiers = ['ctrlKey', 'shiftKey', 'altKey', 'metaKey'];

export function onKeyDown(e) {
    if (keyModifiers.some(m => e[m])) return;
    const shortcuts = getActiveShortcuts();
    const key = e.key.toLowerCase();
    const codeKey = String.fromCharCode(e.keyCode || e.which).toLowerCase();
    const shortcut = shortcuts.find(([sk]) => [key, codeKey].includes(sk.toLowerCase()))
    if (!shortcut) return;
    e.preventDefault();
    window.electron.status(`Used ${formatShortcut(shortcut)}`);
    const [_key, _name, callback] = shortcut;
    callback(e);
}

export function formatShortcut(shortcut) {
    const [key, name] = shortcut;
    return `"${key}" - ${name}`;
}

export function remindShortcuts() {
    const shortcuts = getActiveShortcuts();
    window.electron.status('Shortcuts:', shortcuts.map(formatShortcut));
}
