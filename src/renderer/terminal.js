import testTerminal from "./terminal.test.js";

/** @type {HTMLTextAreaElement} */
export const element = document.querySelector('textarea.terminal');
const history = [];
const inputDebounce = 500;
const lockedLines = new Map();
let historyBase = "";
let inputLoading = false;
let inputTimer;
let lastOnInputSelection;
export const maxHistoryLength = 41;
export let historyIndex = 0;
export const state = { isOpen: false };
setValue(historyBase);

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
    historyBase = getValue(true)
    historyIndex = 0
    history.splice(0, Infinity)
}

export function restore() {
    const lines = getLines(true);
    Array.from(lockedLines).map(([row, data]) => lines[row] = data.line);
    setValue(lines.join('\n'));
    const { start, end, dir } = parseSnapshot(history[historyIndex - 1]);
    if (start) setSelection(start, end, dir);
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
    const index = historyIndex - 2;
    if (index < -1) return;

    setValue(revertLines(index).join('\n'));
    historyIndex--;

    if (index < 0) return;
    const { start, end, dir } = parseSnapshot(history[index]);
    setSelection(start, end, dir);
}

export function calculateLines(index = historyIndex - 1) {
    return Array.from({ length: latestSize(index) }, (v, row) => latestText(row, index));
}

export function revertLines(index = historyIndex - 1) {
    const { entries, lines } = parseSnapshot(history[index + 1]);
    const changedRows = new Map(entries);
    return Array.from({ length: latestSize(index) }, (v, row) => {
        if (!changedRows.has(row)) return lines[row] ?? latestText(row, index);
        return latestText(row, index);
    });
}

function latestSize(index) {
    const snapshotSize = parseSnapshot(history[index])?.size;
    const baseSize = getLines(historyBase).length;
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
    return getLines(historyBase)[row];
}

export function redoHistory(skipSelection) {
    if (historyIndex >= history.length) return;
    applySnapshot(history[historyIndex], null, skipSelection);
    historyIndex++;
}

function applySnapshot(snapshot, value, skipSelection) {
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

function parseSnapshot(snapshot = {}, value) {
    const intKey = ([row, text]) => [parseInt(row), text];
    const isValidRow = ([row]) => Number.isInteger(row) && row >= 0;
    const byFirst = (a, b) => a[0] - b[0];

    const { size, start, end, dir, ...dict } = snapshot;
    const entries = Object.entries(dict).map(intKey).filter(isValidRow).toSorted(byFirst);
    const lines = getLines(value);
    return { size, start, end, dir, entries, lines };
}

export function logHistory() {
    const operation = ([row, text]) => `${row}=${text.length === 1 ? text : `"${text}"`}`;
    const indent = ' '.repeat(2);
    const snapshot = (s, i) => {
        const { size, start, end, dir, entries } = parseSnapshot(s);
        const selection = [start, start !== end && end, dir].filter(Boolean).join('-');
        const entriesStr = entries.map(operation).join(' ');
        return indent + `snap#${i}: size=${size} sel=${selection} ${entriesStr}`;
    };
    const base = indent + `base: ${JSON.stringify(historyBase)}`;

    const value = JSON.stringify(getValue());
    const valueStr = indent + `value: ${value}`;

    const committed = JSON.stringify(getValue(true));
    const committedStr = value !== committed && (indent + `committed: ${committed}`);

    const historyIndexStr = indent + `historyIndex: ${historyIndex}`;
    const historyStr = history.map(snapshot).join('\n');

    const lockedKeys = Array.from(lockedLines.keys());
    const locked = lockedKeys.length > 0 && (indent + `locked: ${lockedKeys}`);

    const logs = [`History:`, base, historyStr, historyIndexStr, valueStr, committedStr, locked];
    console.log(logs.filter(Boolean).join('\n'));
}

export function getLines(value) {
    if (typeof value !== 'string') value = getValue(value);
    return value.replace(/\r/g, "\n").split('\n');
}

export function getLine(row, value) {
    return getLines(value)[row];
}

function write(snapshotDict, skipHistory, skipSelection) {
    commitInput();
    if (skipHistory) return applySnapshot(generateSnapshot(snapshotDict), null, skipSelection);
    if (abortLockedLine(applyEntries(snapshotDict))) return;

    const done = pushHistory(snapshotDict);
    if (!done) return;

    redoHistory(skipSelection);
}

function abortLockedLine(newLines) {
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

export function writeText(text, selection, skipHistory, skipSelection) {
    const { start, end, dir } = selection ?? {};
    const lines = getLines(text);
    const size = lines.length;
    const dictionary = Object.fromEntries(lines.map((text, row) => [row, text]));
    write({ size, start, end, dir, ...dictionary }, skipHistory, skipSelection);
}

export function writeLines(rowTextDict, skipHistory, skipSelection) {
    const lines = getLines();
    const changesRow = ([row, text]) => lines[row] !== text;
    const entries = parseSnapshot(rowTextDict).entries.filter(changesRow);

    const baseSize = getLines(historyBase).length;
    const prevSize = history[historyIndex - 1]?.size;
    const size = Math.max(prevSize ?? baseSize, ...entries.map(([row]) => row + 1));

    const newDict = Object.fromEntries(fillSnaps(entries).concat(entries));
    write({ size, ...newDict }, skipHistory, skipSelection);
}

/** @param {[Number, any][]} rowTextPairs */
function fillSnaps(rowTextPairs) {
    const lines = getLines();
    const end = Math.max(...rowTextPairs.map(([row]) => row));
    const length = end - lines.length;
    const mapfn = (_, i) => [lines.length + i, ''];
    return Array.from({ length }, mapfn);
}

export function writeLine(text, row, skipHistory, skipSelection) {
    row ??= getLines().length;
    return writeLines({ [row]: text }, skipHistory, skipSelection);
}

export function removeLines(startRow, endRow = startRow + 1, skipHistory) {
    const lines = getLines();
    if (startRow < 0 || endRow > lines.length) return;
    const deleteCount = Math.max(0, endRow - startRow);
    const newLines = lines.toSpliced(startRow, deleteCount);

    if (newLines.length === 0) newLines[0] = '';

    const entries = newLines
        .map((text, row) => [row, text])
        .filter(([row, text]) => text !== lines[row]);

    const size = newLines.length
    const newDict = Object.fromEntries(entries);

    const pos = startRow === newLines.length ?
        caretToPos(newLines, Infinity) :
        [startRow, 0];
    write({ size, start: pos, end: pos, ...newDict }, skipHistory);
}

function generateSnapshot(dict, value) {
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

function pushHistory(snapshotDict) {
    const snapshot = generateSnapshot(snapshotDict);

    const prevSize = history[historyIndex - 1]?.size;
    const { size, entries } = parseSnapshot(snapshot);
    if (size === prevSize && !entries.length) return;

    history.splice(historyIndex, Infinity, snapshot);

    const overflow = history.length - maxHistoryLength;
    if (overflow > 0) {
        const snaps = history.splice(0, overflow);
        snaps.forEach(snap => historyBase = applyEntries(snap, historyBase).join('\n'));
        historyIndex -= overflow;
    }

    return true;
}

export function onInput() {
    cancelInput();
    inputLoading = true;
    lastOnInputSelection = getSelection();
    console.log('Input: Wait');

    if (abortLockedLine()) return;

    inputTimer = setTimeout(commitInput, inputDebounce);
}
function commitInput() {
    if (!inputLoading) return;
    cancelInput();
    const text = getValue();
    const selection = getSelection();
    restore();
    console.log('Input: Done');
    writeText(text, lastOnInputSelection);
    const { start, end, dir } = selection;
    setSelection(start, end, dir);
}
function cancelInput() {
    inputLoading = false;
    return clearTimeout(inputTimer);
};

export function caretToPos(lines, caret) {
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

export function posToCaret(lines, row, col = 0) {
    row = clamp(row, 0, lines.length - 1);
    col = clamp(col, 0, lines[row].length);

    const rows = lines.slice(0, row);
    const colLengths = rows.map(c => c.length);
    const lengths = colLengths.map((l, i, a) => l + (i < lines.length - 1 ? 1 : 0));

    return lengths.reduce((acc, len) => acc + len, col);
}

export function clamp(value, min, max) {
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

export function setSelection(start, end = start, dir = undefined) {
    const lines = getLines();
    const caret = pos => posToCaret(lines, pos[0], pos[1]);
    element.setSelectionRange(caret(start), caret(end), dir);
}
