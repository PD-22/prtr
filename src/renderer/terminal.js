import testTerminal from "./terminal.test.js";

/** @type {HTMLTextAreaElement} */
const element = document.querySelector('textarea.terminal');

const history = [];
let historyBase = "";
export const maxHistoryLength = 34;
export let historyIndex = 0;
setTerminalValue(historyBase);

const inputDebounce = 500;
let inputLoading = false;
let inputTimer;
// const lockedLines = new Set();
export const terminal = { element, isOpen: false };

testTerminal(); logHistory();

export function openTerminal() {
    terminal.isOpen = true;
    element.classList.add('is-open');
    setTimeout(() => element.focus());
}

export function closeTerminal() {
    terminal.isOpen = false;
    element.classList.remove('is-open');
}

export function getTerminalValue(live = false) {
    if (live) return element.value;
    return calculateTerminalLines().join('\n');
}

function setTerminalValue(newValue) {
    element.value = newValue;
}

export function undoTerminalHistory() {
    if (historyIndex <= 0) return;
    const index = historyIndex - 2;
    setTerminalValue(calculateTerminalLines(index).join('\n'));
    const { start, end } = calculateSelection(index);
    setTerminalSelection(start, end);
    historyIndex--;
}

export function calculateTerminalLines(index = historyIndex - 1) {
    return Array.from({ length: latestSize(index) }, (v, row) => latestText(row, index));
}

function calculateSelection(index) {
    let { size, entries, start, end } = parseSnapshot(history[index]);
    const lines = calculateTerminalLines(index);
    if (index < 0 || index >= history.length) {
        start = end = lines.join('\n').length;
    } else if (start == null || end == null) {
        const rows = entries.map(([row]) => row);
        const lastRow = rows.length ? Math.max(...rows) : size - 1;
        start = end = posToCaret(lines, lastRow, Infinity);
    }
    return { start, end };
}

function latestSize(index) {
    const snapshotSize = parseSnapshot(history[index])?.size;
    const baseSize = getTerminalLines(historyBase).length;
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
    return getTerminalLines(historyBase)[row];
}

export function redoTerminalHistory() {
    if (historyIndex >= history.length) return;
    const { text } = applySnapshot(history[historyIndex], getTerminalValue())
    setTerminalValue(text);
    const { start, end } = calculateSelection(historyIndex);
    history[historyIndex].start = start;
    history[historyIndex].end = end;
    setTerminalSelection(start, end);
    historyIndex++;
}

export function applySnapshot(snapshot, text) {
    const { size, start, end, ...dict } = snapshot;
    const lines = getTerminalLines(text);

    parseSnapshot(dict).entries.forEach(operation => {
        const [row, text] = operation;
        lines[row] = text;
    });

    lines.length = size;

    return { text: lines.join('\n'), start, end };
}

function parseSnapshot(snapshot = {}) {
    const intKey = ([row, text]) => [parseInt(row), text];
    const isValidRow = ([row]) => Number.isInteger(row) && row >= 0;
    const byFirst = (a, b) => a[0] - b[0];

    const { size, start, end, ...dict } = snapshot;
    const entries = Object.entries(dict).map(intKey).filter(isValidRow).toSorted(byFirst);
    return { size, start, end, entries };
}

export function logHistory() {
    const operation = ([row, text]) => `${row}=${text.length === 1 ? text : `"${text}"`}`;
    const indent = ' '.repeat(2);
    const snapshot = (s, i) => {
        const { size, start, end, entries } = parseSnapshot(s);
        const selection = start === end ? `caret=${start}` : `start=${start} end=${end}`;
        return indent + `snap#${i}: size=${size} ${selection} ${entries.map(operation).join(' ')}`
    };
    const base = indent + `base: ${JSON.stringify(historyBase)}`;

    const value = JSON.stringify(getTerminalValue());
    const valueStr = indent + `value: ${value}`;

    const live = JSON.stringify(getTerminalValue(true));

    const matches = value === live;
    if (!matches) console.warn('value and live do not match', value, live);

    const historyIndexStr = indent + `historyIndex: ${historyIndex}`;
    const historyStr = history.map(snapshot).join('\n');
    const logs = [`History:`, base, historyStr, historyIndexStr, valueStr];
    console.log(logs.filter(Boolean).join('\n'));
}

export function getTerminalLines(value = getTerminalValue()) {
    return value.replace(/\r/g, "\n").split('\n');
}

export function writeTerminal(text, start, end) {
    const lines = getTerminalLines(text);
    const size = lines.length;
    const dictionary = Object.fromEntries(lines.map((text, row) => [row, text]));
    pushHistory({ size, start, end, ...dictionary });
}

export function writeTerminalLines(rowTextDict) {
    const lines = getTerminalLines();
    const changesRow = ([row, text]) => lines[row] !== text;
    const entries = parseSnapshot(rowTextDict).entries.filter(changesRow);

    const baseSize = getTerminalLines(historyBase).length;
    const prevSize = history[historyIndex - 1]?.size;
    const size = Math.max(prevSize ?? baseSize, ...entries.map(([row]) => row + 1));

    const newDict = Object.fromEntries(fillSnaps(entries).concat(entries));
    pushHistory({ size, ...newDict });
}

/** @param {[Number, any][]} rowTextPairs */
function fillSnaps(rowTextPairs) {
    const lines = getTerminalLines();
    const end = Math.max(...rowTextPairs.map(([row]) => row));
    const length = end - lines.length;
    const mapfn = (_, i) => [lines.length + i, ''];
    return Array.from({ length }, mapfn);
}

export function writeTerminalLine(text, row = getTerminalLines().length) {
    return writeTerminalLines({ [row]: text });
}

export function removeTerminalLines(startRow, endRow = startRow + 1) {
    const lines = getTerminalLines();
    if (startRow < 0 || endRow > lines.length) return;
    const deleteCount = Math.max(0, endRow - startRow);
    const newLines = lines.toSpliced(startRow, deleteCount);
    if (newLines.length === lines.length) return;

    const entries = newLines
        .map((text, row) => [row, text])
        .filter(([row, text]) => text !== lines[row]);

    const size = newLines.length
    const newDict = Object.fromEntries(entries);

    const caret = startRow === newLines.length ?
        newLines.join('\n').length :
        posToCaret(newLines, startRow, 0);
    pushHistory({ size, start: caret, end: caret, ...newDict });
}

function pushHistory(snapshotDict) {
    let { size, start, end, entries } = parseSnapshot(snapshotDict);
    const lines = getTerminalLines();

    const filteredEntries = entries.filter(([row, text]) => lines[row] !== text);
    const dictionary = Object.fromEntries(filteredEntries);
    const cleanEntries = Object.entries(dictionary);

    const prevSize = history[historyIndex - 1]?.size;
    if (size === prevSize && !cleanEntries.length) return;

    const snapshot = { size, start, end, ...dictionary };
    history.splice(historyIndex, Infinity, snapshot);

    const overflow = history.length - maxHistoryLength;
    if (overflow > 0) {
        const snaps = history.splice(0, overflow);
        snaps.forEach(snap => historyBase = applySnapshot(snap, historyBase).text);
        historyIndex -= overflow;
    }

    redoTerminalHistory();
}

export function onTerminalInput() {
    cancelInputHistory();
    inputLoading = true;
    inputTimer = setTimeout(commitInputHistory, inputDebounce);
}
function commitInputHistory() {
    if (!inputLoading) return;
    cancelInputHistory();
    console.log('commitInputHistory');
    writeTerminal(getTerminalValue(true));
}
function cancelInputHistory() {
    inputLoading = false;
    return clearTimeout(inputTimer);
};

export function caretToPos(lines, caret) {
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
    row = clamp(row, 0, lines.length);
    col = clamp(col, 0, lines[row].length);

    const rows = lines.slice(0, row);
    const colLengths = rows.map(c => c.length);
    const lengths = colLengths.map((l, i, a) => l + (i < lines.length - 1 ? 1 : 0));

    return lengths.reduce((acc, len) => acc + len, col);
}

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function getTerminalSelection() {
    const { selectionDirection, selectionStart, selectionEnd } = element;
    const caret = selectionDirection === 'forward' ? selectionEnd : selectionStart;
    return { start: selectionStart, end: selectionEnd, dir: selectionDirection, caret };
}

export function setTerminalSelection(start, end = start, dir) {
    element.setSelectionRange(start, end, dir);
}
