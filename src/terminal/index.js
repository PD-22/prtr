import testTerminal from "./test.js";

export * from "./write.js";
export * from "./checkout.js";
import { commitInput } from "./input.js";
export * from "./input.js";
export * from "./lock.js";
export * from "./select.js";
import { getSelection, setSelection } from "./select.js";
export * from "./value.js";
import { setValue, getValue, getLines } from "./value.js";
export * from "./logHistory.js";

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

testTerminal();

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

export function restore(skipSelection, skipLock) {
    const snapshot = history[state.historyIndex];
    const selection = skipSelection ? getSelection() : parseSnapshot(snapshot);
    const { start, end, dir } = selection;

    const lines = getLines(true);
    const newLines = skipLock ? lines : lines.map(
        (text, row) => lockedLines.get(row)?.line ?? text
    );

    setValue(newLines.join('\n'));
    setSelection(start, end, dir);
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

export function applySnapshot(snapshot, value, skipSelection) {
    let { start, end, dir } = parseSnapshot(snapshot);

    setValue(applyEntries(snapshot, value).join('\n'), skipSelection);
    if (skipSelection) return;
    setSelection(start, end, dir);
}

export function applyEntries(snapshot, value) {
    const lines = getLines(value);
    const { size, entries } = parseSnapshot(snapshot);
    entries.forEach(([row, text]) => lines[row] = text);
    lines.length = size;
    return lines;
}

export function parseSnapshot(snapshot = {}, value) {
    const intKey = ([row, text]) => [parseInt(row), text];
    const isValidRow = ([row]) => Number.isInteger(row) && row >= 0;
    const byFirst = (a, b) => a[0] - b[0];

    const { size, start, end, dir, ...dict } = snapshot;
    const entries = Object.entries(dict).map(intKey).filter(isValidRow).toSorted(byFirst);
    const lines = getLines(value);
    const newValue = lines.join('\n')
    return { size, start, end, dir, entries, lines, value: newValue };
}

export function generateSnapshot(dict, value) {
    let { size, start, end, dir, entries, lines } = parseSnapshot(dict, value);

    const filteredEntries = entries.filter(([row, text]) => lines[row] !== text);
    const dictionary = Object.fromEntries(filteredEntries);
    const cleanEntries = parseSnapshot(dictionary).entries;

    end ??= start;
    if (start == null) {
        const newLines = applyEntries({ size, ...dictionary });
        const rows = cleanEntries.map(([row]) => row);
        const lastRow = rows.length ? Math.max(...rows) : size - 1;
        start = end = [lastRow, newLines[lastRow].length];
    }

    return { size, start, end, dir, ...dictionary };
}

export function clamp(value, min = -Infinity, max = Infinity) {
    return Math.min(Math.max(value, min), max);
}
