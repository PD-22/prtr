export * from "./checkout.js";
export * from "./input.js";
export * from "./lock.js";
export * from "./logHistory.js";
export * from "./select.js";
export * from "./snapshot.js";
export * from "./value.js";
export * from "./write.js";
import { commitInput } from "./input.js";
import { parseSnapshot } from "./snapshot.js";
import { getLines, getValue, setValue } from "./value.js";

/** @type {HTMLTextAreaElement} */
export const element = document.querySelector('textarea.terminal');
export const history = [];
export const inputDebounce = 500;
/** @type {Map<number, { line: string, onPrevent: Function }} */
export const lockedLines = new Map();
export const maxHistoryLength = 40;
export const state = {
    isOpen: false,
    historyIndex: -1,
    historyBase: "",
    lastOnInputSelection: undefined,
    inputTimer: undefined,
    inputLoading: false
};
setValue(state.historyBase);
// testTerminal();

export function toggle() {
    (state.isOpen ? close : open)();
}

export function open() {
    state.isOpen = true;
    element.classList.add('is-open');
    setTimeout(() => element.focus());
}

export function close() {
    commitInput();
    state.isOpen = false;
    element.classList.remove('is-open');
}

export function clearHistory() {
    state.historyBase = getValue(true)
    state.historyIndex = -1
    history.splice(0, Infinity)
}

export function getHistoryLength() {
    return history.length;
}

export function latestSize(index) {
    const snapshotSize = parseSnapshot(history[index])?.size;
    const baseSize = getLines(state.historyBase).length;
    return snapshotSize ?? baseSize;
}

export function latestText(row, index) {
    for (let i = Math.min(index, history.length - 1); i >= 0; i--) {
        const entries = parseSnapshot(history[i])?.entries;
        for (let j = 0; j < entries.length; j++) {
            const operation = entries[j];
            const [curRow, text] = operation;
            if (curRow === row) return text;
        }
    }
    return getLines(state.historyBase)[row];
}

export function clamp(value, min = -Infinity, max = Infinity) {
    return Math.min(Math.max(value, min), max);
}
