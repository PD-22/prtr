import testTerminal from "./terminal.test.js";

import * as write from "./terminal/write.js";
export * from "./terminal/write.js";
const { writeText } = write;

/** @type {HTMLTextAreaElement} */
export const element = document.querySelector('textarea.terminal');
const history = [];
const inputDebounce = 500;
/** @type {Map<number, { line: string, onPrevent: Function }} */
const lockedLines = new Map();
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

function setValue(newValue, skipSelection) {
    if (getAbortRows(getLines(newValue)).length) throw new Error('Locked line');

    if (!skipSelection) return element.value = newValue;

    const selection = getSelection();
    let { start, end, dir } = selection;
    element.value = newValue;
    setSelection(start, end, dir);
}

export function undoHistory() {
    const newIndex = state.historyIndex - 1

    if (newIndex < -1) { return restore(); }
    if (state.inputLoading) { return settleInput(); }

    state.historyIndex = clamp(newIndex, -1);

    setValue(revertLines(newIndex).join('\n'));

    const snapshot = history[newIndex];
    const { start, end, dir } = parseSnapshot(snapshot);
    if (start) setSelection(start, end, dir);
}

export function calculateLines(index = state.historyIndex) {
    return Array.from({ length: latestSize(index) }, (v, row) => latestText(row, index));
}

export function revertLines(index = state.historyIndex - 1) {
    const { entries, lines } = parseSnapshot(history[index + 1]);
    const changedRows = new Map(entries);
    return Array.from({ length: latestSize(index) }, (v, row) => {
        if (!changedRows.has(row)) return lines[row] ?? latestText(row, index);
        return latestText(row, index);
    });
}

export function latestSize(index) {
    const snapshotSize = parseSnapshot(history[index])?.size;
    const baseSize = getLines(state.historyBase).length;
    return snapshotSize ?? baseSize;
}

function latestText(row, index) {
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

export function redoHistory(skipSelection) {
    const newIndex = state.historyIndex + 1;
    state.historyIndex = clamp(newIndex, -1, history.length - 1);

    if (state.inputLoading) return;
    if (newIndex > history.length - 1) return restore();
    // if (state.inputLoading) { return settleInput(); }

    applySnapshot(history[state.historyIndex], null, skipSelection);
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

export function abortLockedLine(newLines) {
    const abortRows = getAbortRows(newLines);
    const lines = getLines();
    abortRows.forEach(([row, line]) => lines[row] = line);

    setValue(lines.join('\n'), true);

    abortRows.forEach(([, , onPrevent]) => onPrevent?.());
    return Boolean(abortRows.length);
}

function getAbortRows(newLines = getLines()) {
    const format = ([row, { line, onPrevent }]) => [row, line, onPrevent];
    const rowChanged = ([row, line]) => newLines[row] !== line;
    return Array.from(lockedLines).map(format).filter(rowChanged);
}

export function getLockedLines() { return new Map(lockedLines); }
export function lockLine(row, onPrevent) {
    const line = getLine(row);
    lockedLines.set(row, { line, onPrevent });
}
export function unlockLine(row) { lockedLines.delete(row); }

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

export function pushHistory(snapshotDict) {
    const snapshot = generateSnapshot(snapshotDict);

    const prevSize = latestSize(state.historyIndex);
    const { size, entries } = parseSnapshot(snapshot);
    if (size === prevSize && !entries.length) return;

    history.splice(state.historyIndex + 1, Infinity, snapshot);

    const overflow = history.length - maxHistoryLength;
    if (overflow > 0) {
        const snaps = history.splice(0, overflow);
        snaps.forEach(snap => state.historyBase = applyEntries(snap, state.historyBase).join('\n'));
        state.historyIndex -= overflow;
    }

    return true;
}

export function onInput() {
    cancelInput();
    state.inputLoading = true;
    state.lastOnInputSelection = getSelection();

    if (abortLockedLine()) return;

    state.inputTimer = setTimeout(commitInput, inputDebounce);
}
export function commitInput() {
    if (!state.inputLoading) return;
    cancelInput();
    const text = getValue();
    const selection = getSelection();
    restore();
    writeText(text, state.lastOnInputSelection);
    const { start, end, dir } = selection;
    setSelection(start, end, dir);
}
function cancelInput() {
    state.inputLoading = false;
    return clearTimeout(state.inputTimer);
};
export function settleInput(skipSelection) {
    cancelInput();
    restore(skipSelection);
}
export function mockInput(text, selection, preCommit) {
    element.value = text;
    const { start, end, dir } = selection ?? {};
    setSelection(start, end, dir);
    onInput();
    if (preCommit?.(cancelInput) === false) return;
    commitInput();
}

export function caretToPos(lines = getLines(), caret = Infinity) {
    caret = clamp(caret, 0, lines.join('\n').length);
    let index = 0;
    let row;

    for (row = 0; row < lines.length; row++) {
        const line = lines[row];
        const length = line.length;
        const nextCount = index + length + 1;
        if (nextCount > caret) break;
        index = nextCount;
    }

    const col = caret - index;

    return [row, col];
}

export function posToCaret(lines = getLines(), row = Infinity, col = Infinity) {
    row = clamp(row, 0, lines.length - 1);
    col = clamp(col, 0, lines[row].length);

    const rows = lines.slice(0, row);
    const colLengths = rows.map(c => c.length);
    const lengths = colLengths.map((l, i, a) => l + (i < lines.length - 1 ? 1 : 0));

    return lengths.reduce((acc, len) => acc + len, col);
}

export function clamp(value, min = -Infinity, max = Infinity) {
    return Math.min(Math.max(value, min), max);
}

export function getSelection() {
    const { selectionDirection, selectionStart, selectionEnd } = element;
    const caret = selectionDirection === 'forward' ? selectionEnd : selectionStart;
    const lines = getLines();
    const pos = caret => caretToPos(lines, caret);
    return {
        start: pos(selectionStart),
        end: pos(selectionEnd),
        caret: pos(caret),
        dir: selectionDirection
    };
}

export function setSelection(start, end, dir = undefined) {
    const lines = getLines();
    start ??= caretToPos();
    end ??= start;
    const caret = pos => posToCaret(lines, pos[0], pos[1]);
    setSelectionCaret(caret(start), caret(end), dir);
}

export function setSelectionCaret(start = getValue().length, end = start, dir = undefined) {
    element.setSelectionRange(start, end, dir);
}
