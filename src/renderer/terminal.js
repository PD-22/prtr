import testTerminal from "./terminal.test.js";

export * from "./terminal/write.js";
export * from "./terminal/checkout.js";
import { commitInput } from "./terminal/input.js";
export * from "./terminal/input.js";
import { getAbortRows } from "./terminal/lock.js";
export * from "./terminal/lock.js";
export * from "./terminal/select.js";
import { getSelection, setSelection } from "./terminal/select.js";

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

export function getValue(commited = false) {
    return commited ? calculateLines().join('\n') : element.value;
}

export function setValue(newValue, skipSelection) {
    if (getAbortRows(getLines(newValue)).length) throw new Error('Locked line');

    if (!skipSelection) return element.value = newValue;

    const selection = getSelection();
    let { start, end, dir } = selection;
    element.value = newValue;
    setSelection(start, end, dir);
}

export function calculateLines(index = state.historyIndex) {
    return Array.from({ length: latestSize(index) }, (v, row) => latestText(row, index));
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

export function logHistory() {
    const operation = ([row, text]) => `${row}=${text.length === 1 ? text : `"${text}"`}`;
    const indent = ' '.repeat(2);
    const sel = ({ start, end, dir }) => {
        const diff = JSON.stringify(start) !== JSON.stringify(end);
        const list = [start, diff && end, dir?.[0]];
        return list.filter(Boolean).join('-');
    };
    const snapshot = (s, i) => {
        const { size, start, end, dir, entries } = parseSnapshot(s);
        const selStr = sel({ start, end, dir });
        const entriesStr = entries.map(operation).join(' ');
        return `${i}: size=${size} sel=${selStr} ${entriesStr}`;
    };
    const value = JSON.stringify(getValue());
    const valueStr = indent + `value: ${value}`;

    const selStr = indent + `sel: ${sel(getSelection())}`;

    const committed = JSON.stringify(getValue(true));
    const committedStr = value !== committed && (indent + `committed: ${committed}`);


    const base = `#: ${JSON.stringify(state.historyBase)}`;
    const historyStr = [base, ...history].map((s, i) => {
        const mid = --i === state.historyIndex ? '> ' : '  ';
        const end = i < 0 ? base : snapshot(s, i);
        return `${indent}${mid}${end}`;
    }).join('\n');

    const historyIndexStr = indent + `historyIndex: ${state.historyIndex}`;

    const lockedKeys = Array.from(lockedLines.keys());
    const locked = lockedKeys.length > 0 && (indent + `locked: ${lockedKeys}`);

    const logs = [
        `History:`, historyStr, historyIndexStr,
        valueStr, committedStr, selStr, locked
    ];
    console.log(logs.filter(Boolean).join('\n'));
}

export function getLines(value) {
    if (typeof value !== 'string') value = getValue(value);
    return value.replace(/\r/g, "\n").split('\n');
}

export function getLine(row, value) {
    return getLines(value)[row];
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
