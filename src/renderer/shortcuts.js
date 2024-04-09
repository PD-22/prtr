import * as terminal from "../terminal/index.js";
import note from "./note.js";
import shortcutsMain from "./shortcutsMain.js";
import shortcutsTerminal from "./shortcutsTerminal.js";

const commonShortcuts = [
    ['F1', 'F1', 'Info', toggleShortcuts],
    ['Tab', 'Tab', 'Switch', () => terminal.toggle()],
];
setTimeout(toggleShortcuts);

export function getActiveShortcuts() {
    const openShortcuts = terminal.state.isOpen ? shortcutsTerminal : shortcutsMain;
    return commonShortcuts.concat(openShortcuts);
}

export function onKeyDown(e) {
    getActiveShortcuts().forEach(s => handleShortcut(e, s));
}

function handleShortcut(e, shortcut) {
    const [input, , , callback] = shortcut;
    if (typeof callback !== "function") return;

    const inputs = Array.isArray(input) ? input : [input];
    const matchedInput = inputs.find(input => shortcutMatches(e, input));
    if (!matchedInput) return;

    e.preventDefault();
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

let remindOpen = false;
function toggleShortcuts() {
    note(remindOpen ? undefined : formatShortcuts(), Infinity, 'remind');
    remindOpen = !remindOpen;
}

export function formatShortcuts() {
    return getActiveShortcuts()
        .filter((([, , name]) => name))
        .map((([input, displayInput, name]) => [name, displayInput || input].join(' - ')))
        .join('\n');
}

export function updateRemind() {
    if (!remindOpen) return;
    note(formatShortcuts(), Infinity, 'remind');
}
