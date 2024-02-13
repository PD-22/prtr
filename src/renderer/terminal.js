import testTerminal from "./terminal.test.js";

/** @type {HTMLTextAreaElement} */
const element = document.querySelector('textarea.terminal');

const history = [];
let historyBase = "";
export const maxHistoryLength = 33;
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
    return calculateTerminalLines(historyIndex - 1).join('\n');
}

function setTerminalValue(newValue) {
    element.value = newValue;
}

export function undoTerminalHistory() {
    if (historyIndex <= 0) return;
    setTerminalValue(calculateTerminalLines(historyIndex - 2).join('\n'));
    historyIndex--;
}

function calculateTerminalLines(index) {
    return Array.from({ length: latestSize(index) }, (v, row) => latestText(row, index));
}

function latestSize(index) {
    const snapshotSize = parseSnapshot(history[index])?.size;
    const baseSize = getTerminalLines(historyBase).length;
    return snapshotSize ?? baseSize;
}

function latestText(row, index) {
    for (let i = index; i >= 0; i--) {
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
    setTerminalValue(applySnapshot(history[historyIndex], getTerminalValue()));
    historyIndex++;
}

export function applySnapshot(snapshot, text) {
    const { size, ...dict } = snapshot;
    const lines = getTerminalLines(text);

    parseSnapshot(dict).entries.forEach(operation => {
        const [row, text] = operation;
        lines[row] = text;
    });

    lines.length = size;
    return lines.join('\n');
}

function parseSnapshot(snapshot = {}) {
    const intKey = ([row, text]) => [parseInt(row), text];
    const isValidRow = ([row]) => Number.isInteger(row) && row >= 0;
    const byFirst = (a, b) => a[0] - b[0];

    const { size, ...dict } = snapshot;
    const entries = Object.entries(dict).map(intKey).filter(isValidRow).toSorted(byFirst);
    return { size, entries };
}

export function logHistory() {
    const operation = ([row, text]) => `${row}=${text.length === 1 ? text : `"${text}"`}`;
    const indent = ' '.repeat(2);
    const snapshot = (s, i) => {
        const { size, entries } = parseSnapshot(s);
        return indent + `snap#${i}: size=${size} ${entries.map(operation).join(' ')}`
    };
    const base = indent + `base: ${JSON.stringify(historyBase)}`;
    const value = indent + `value: ${JSON.stringify(getTerminalValue())}`;
    const historyIndexStr = indent + `historyIndex: ${historyIndex}`;
    const historyStr = history.map(snapshot).join('\n');
    const logs = [`History:`, base, historyStr, historyIndexStr, value];
    console.log(logs.filter(Boolean).join('\n'));
}

export function getTerminalLines(value = getTerminalValue()) {
    return value.replace(/\r/g, "\n").split('\n');
}

export function writeTerminal(text) {
    const lines = getTerminalLines(text);
    const size = lines.length;
    const dictionary = Object.fromEntries(lines.map((text, row) => [row, text]));
    pushHistory({ size, ...dictionary });
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

export function removeTerminalLines(start, end = start + 1) {
    const lines = getTerminalLines();
    const deleteCount = Math.max(0, end - start);
    const newLines = lines.toSpliced(start, deleteCount);
    if (newLines.length === lines.length) return;

    const entries = newLines
        .map((text, row) => [row, text])
        .filter(([row, text]) => text !== lines[row]);

    const size = newLines.length
    const newDict = Object.fromEntries(entries);

    pushHistory({ size, ...newDict });
}

function pushHistory(snapshotDict) {
    let { size, entries } = parseSnapshot(snapshotDict);
    const lines = getTerminalLines();

    const filteredEntries = entries.filter(([row, text]) => lines[row] !== text);
    const dictionary = Object.fromEntries(filteredEntries);
    const cleanEntries = Object.entries(dictionary);

    const prevSize = history[historyIndex - 1]?.size;
    if (size === prevSize && !cleanEntries.length) return;

    const snapshot = { size, ...dictionary };
    history.splice(historyIndex, Infinity, snapshot);

    const overflow = history.length - maxHistoryLength;
    if (overflow > 0) {
        const snaps = history.splice(0, overflow);
        snaps.forEach(snap => historyBase = applySnapshot(snap, historyBase));
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
