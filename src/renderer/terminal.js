import shortcutsTerminal from "./shortcutsTerminal.js";

/** @type {HTMLTextAreaElement} */
const element = document.querySelector('textarea.terminal');

const history = [];
let historyBase = "X\nY\nZ\nA";
// let historyBase = "";
const maxHistoryLength = 28;
let historyIndex = 0;
setTerminalValue(historyBase);

const inputDebounce = 500;
let inputLoading = false;
const lockedLines = new Set();
let debounceId;
export const terminal = { element, isOpen: false };

const assert = (expected, actual) => {
    if (expected === actual) return;
    expected = JSON.stringify(expected);
    actual = JSON.stringify(actual);
    throw new Error(`Expected: ${expected} Got: ${actual}`);
}
const assertTerminal = text => { assert(text, getTerminalValue()); logHistory(); };
const assertUndoRedoTerminal = (...arr) => {
    assert(arr.length, maxHistoryLength);
    assert(maxHistoryLength, historyIndex);
    const indexList = arr.map((_v, i) => i);

    indexList.toReversed().slice(1).forEach(i => {
        undoTerminalHistory();
        assert(i, historyIndex - 1);
        assertTerminal(arr[i]);
    });

    indexList.slice(1).forEach(i => {
        redoTerminalHistory();
        assert(i, historyIndex - 1);
        assertTerminal(arr[i]);
    });
};
openTerminal();                                             /**/assertTerminal('X\nY\nZ\nA');
writeTerminalLine('N', 3);                                  /**/assertTerminal('X\nY\nZ\nN');
removeTerminalLines(3);                                     /**/assertTerminal('X\nY\nZ');
writeTerminalLine('B', 0);                                  /**/assertTerminal('B\nY\nZ');
writeTerminalLine('C', 1);                                  /**/assertTerminal('B\nC\nZ');
writeTerminalLines({ 0: 'D', 1: 'E', 2: 'F', 3: 'G' });     /**/assertTerminal('D\nE\nF\nG');
undoTerminalHistory();                                      /**/assertTerminal('B\nC\nZ');
undoTerminalHistory();                                      /**/assertTerminal('B\nY\nZ');
undoTerminalHistory();                                      /**/assertTerminal('X\nY\nZ');
undoTerminalHistory();                                      /**/assertTerminal('X\nY\nZ\nN');
writeTerminalLine('B');                                     /**/assertTerminal('X\nY\nZ\nN\nB');
removeTerminalLines(1);                                     /**/assertTerminal('X\nZ\nN\nB');
removeTerminalLines(2);                                     /**/assertTerminal('X\nZ\nB');
removeTerminalLines(0);                                     /**/assertTerminal('Z\nB');
undoTerminalHistory();                                      /**/assertTerminal('X\nZ\nB');
writeTerminalLine('T');                                     /**/assertTerminal('X\nZ\nB\nT');
writeTerminalLine('R');                                     /**/assertTerminal('X\nZ\nB\nT\nR');
undoTerminalHistory();                                      /**/assertTerminal('X\nZ\nB\nT');
removeTerminalLines(2);                                     /**/assertTerminal('X\nZ\nT');
writeTerminalLine("A", 0);                                  /**/assertTerminal('A\nZ\nT');
writeTerminalLine("B");                                     /**/assertTerminal('A\nZ\nT\nB');
writeTerminalLine("C");                                     /**/assertTerminal('A\nZ\nT\nB\nC');
removeTerminalLines(2);                                     /**/assertTerminal('A\nZ\nB\nC');
writeTerminalLine("B", 1);                                  /**/assertTerminal('A\nB\nB\nC');
writeTerminalLine("Q", 2);                                  /**/assertTerminal('A\nB\nQ\nC');
writeTerminalLines({ 0: 'C', 1: 'D', 2: 'E', 3: 'F' });     /**/assertTerminal('C\nD\nE\nF');
undoTerminalHistory();                                      /**/assertTerminal('A\nB\nQ\nC');
writeTerminalLines({ 0: 'X', 1: 'X', 2: 'X', 3: 'X' });     /**/assertTerminal('X\nX\nX\nX');
writeTerminalLines({ 2: 'C', 1: 'D', 0: 'E' });             /**/assertTerminal('E\nD\nC\nX');
writeTerminalLines({ 5: 'H', 7: 'J' });                     /**/assertTerminal('E\nD\nC\nX\n\nH\n\nJ');
removeTerminalLines(4);                                     /**/assertTerminal('E\nD\nC\nX\nH\n\nJ');
removeTerminalLines(6);                                     /**/assertTerminal('E\nD\nC\nX\nH\n');
removeTerminalLines(0, 2);                                  /**/assertTerminal('C\nX\nH\n');
removeTerminalLines(-2, 2);                                 /**/assertTerminal('C\nX');
writeTerminalLines({ 0: 'C', 1: 'X' });                     /**/assertTerminal('C\nX');
undoTerminalHistory();                                      /**/assertTerminal('C\nX\nH\n');
redoTerminalHistory();                                      /**/assertTerminal('C\nX');
writeTerminalLine('A');                                     /**/assertTerminal('C\nX\nA');
writeTerminalLine('B');                                     /**/assertTerminal('C\nX\nA\nB');
writeTerminalLine('C');                                     /**/assertTerminal('C\nX\nA\nB\nC');
writeTerminalLine('D');                                     /**/assertTerminal('C\nX\nA\nB\nC\nD');
removeTerminalLines(0, 2);                                  /**/assertTerminal('A\nB\nC\nD');
writeTerminalLines({ 4: 'E', 5: 'F', 6: 'G', 7: 'H' });     /**/assertTerminal('A\nB\nC\nD\nE\nF\nG\nH');
writeTerminal('A\nB\nC\nD\nE\nF\nG\nH');                    /**/assertTerminal('A\nB\nC\nD\nE\nF\nG\nH');
writeTerminal('H\nG\nF\nE\nD\nC\nB\nA');                    /**/assertTerminal('H\nG\nF\nE\nD\nC\nB\nA');

writeTerminal('  Username\n[ASD]  Username1\n[ASD] Username2  \n[ASD] UserName3   -   ...\n[ASD]    Username123\n[ASD] Username-Name  -    123\n  Username4\n   [ASD] UserName5  - 123');
assertTerminal('  Username\n[ASD]  Username1\n[ASD] Username2  \n[ASD] UserName3   -   ...\n[ASD]    Username123\n[ASD] Username-Name  -    123\n  Username4\n   [ASD] UserName5  - 123');

shortcutsTerminal.find(x => x[1] === 'Clean')[2]();
assertTerminal('Username\nUsername1\nUsername2\nUserName3 - ...\nUsername123\nUsername-Name - 123\nUsername4\nUserName5 - 123');

shortcutsTerminal.find(x => x[1] === 'Clear')[2]();
assertTerminal('Username\nUsername1\nUsername2\nUserName3\nUsername123\nUsername-Name\nUsername4\nUserName5');

assertUndoRedoTerminal(
    'X\nY\nZ\nN\nB',
    'X\nZ\nN\nB',
    'X\nZ\nB',
    'X\nZ\nB\nT',
    'X\nZ\nT',
    'A\nZ\nT',
    'A\nZ\nT\nB',
    'A\nZ\nT\nB\nC',
    'A\nZ\nB\nC',
    'A\nB\nB\nC',
    'A\nB\nQ\nC',
    'X\nX\nX\nX',
    'E\nD\nC\nX',
    'E\nD\nC\nX\n\nH\n\nJ',
    'E\nD\nC\nX\nH\n\nJ',
    'E\nD\nC\nX\nH\n',
    'C\nX\nH\n',
    'C\nX',
    'C\nX\nA',
    'C\nX\nA\nB',
    'C\nX\nA\nB\nC',
    'C\nX\nA\nB\nC\nD',
    'A\nB\nC\nD',
    'A\nB\nC\nD\nE\nF\nG\nH',
    'H\nG\nF\nE\nD\nC\nB\nA',
    '  Username\n[ASD]  Username1\n[ASD] Username2  \n[ASD] UserName3   -   ...\n[ASD]    Username123\n[ASD] Username-Name  -    123\n  Username4\n   [ASD] UserName5  - 123',
    'Username\nUsername1\nUsername2\nUserName3 - ...\nUsername123\nUsername-Name - 123\nUsername4\nUserName5 - 123',
    'Username\nUsername1\nUsername2\nUserName3\nUsername123\nUsername-Name\nUsername4\nUserName5'
);

export function openTerminal() {
    terminal.isOpen = true;
    element.classList.add('is-open');
    setTimeout(() => element.focus());
}

export function closeTerminal() {
    // commitInputHistory();
    terminal.isOpen = false;
    element.classList.remove('is-open');
}

export function getTerminalValue() {
    return element.value;
}

function getHistoryValue() {
    return history[historyIndex].value;
}

function setTerminalValue(newValue) {
    element.value = newValue;
}

export function lockTerminalLine(row) {
    lockedLines.add(row);
}
export function unlockTerminalLine(row) {
    lockedLines.delete(row);
}
function abortCorruptedLines(newValue) {
    const lines = getTerminalLines(getHistoryValue());
    const newLines = getTerminalLines(newValue);
    const rowChanged = row => lines[row] !== newLines[row];
    const abortRows = Array.from(lockedLines).filter(rowChanged);
    if (!abortRows.length) return false;
    abortRows.forEach(row => { window.electron.abortScrape(row); });
    return true;
}

export function onTerminalInput() {
    // cancelInputHistory();
    // if (abortCorruptedLines(getTerminalValue())) return checkoutTerminalHistory(0);
    // inputLoading = true;
    // debounceId = setTimeout(commitInputHistory, inputDebounce);
}
function commitInputHistory() {
    if (!inputLoading) return;
    cancelInputHistory();
    writeTerminal(getTerminalValue(), getTerminalSelection());
}
function cancelInputHistory() {
    inputLoading = false;
    return clearTimeout(debounceId);
};

function parseSelection(value, selection) {
    let start = selection?.start;
    let end = selection?.end;
    let dir = selection?.dir;

    if (start == null) start = value.length;
    if (end == null) end = value.length;
    start = Math.min(start, end);

    if (selection === true) {
        const prevSelection = getTerminalSelection();
        const prevLines = getTerminalLines();
        const lines = getTerminalLines(value);
        start = posToCaret(lines, ...caretToPos(prevLines, prevSelection.start));
        end = posToCaret(lines, ...caretToPos(prevLines, prevSelection.end));
    }

    return { start, end, dir };
}

function checkoutTerminalHistory(change) {
    commitInputHistory();
    const newHistoryIndex = clamp(historyIndex + change, 0, history.length - 1);

    historyIndex = newHistoryIndex;
    const { value, start, end, dir } = history[historyIndex];
    setTerminalValue(value);
    setTerminalSelection(start, end, dir);
}

export function undoTerminalHistory() {
    if (historyIndex <= 0) return;
    const { size, entries } = parseSnapshot(history[historyIndex - 1]);
    const changedRows = entries.map(([row]) => row);

    const lastSize = latestSize();
    const removedCount = Math.max(0, lastSize - size);
    // TODO: may need edge fillSnaps
    const removedRows = Array.from({ length: removedCount }, (_, i) => size + i);

    const restoreRowsInit = changedRows.concat(removedRows).filter(x => x < lastSize);
    const restoreRows = Array.from(new Set(restoreRowsInit)).toSorted((a, b) => a - b);

    const lines = getTerminalLines();
    restoreRows.forEach(row => lines[row] = latestText(row));
    lines.length = lastSize;
    setTerminalValue(lines.join('\n'));
    historyIndex--;
}

function latestSize() {
    for (let i = historyIndex - 2; i >= 0; i--) {
        const { size } = parseSnapshot(history[i]);
        return size;
    }
    return getTerminalLines(historyBase).length;
}

function latestText(row) {
    for (let i = historyIndex - 2; i >= 0; i--) {
        const { size, entries } = parseSnapshot(history[i]);
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

function parseSnapshot(snapshot) {
    const intKey = ([row, text]) => [parseInt(row), text];
    const isValidRow = ([row]) => Number.isInteger(row) && row >= 0;
    const byFirst = (a, b) => a[0] - b[0];

    const { size, ...dict } = snapshot;
    const entries = Object.entries(dict).map(intKey).filter(isValidRow).toSorted(byFirst);
    return { size, entries };
}

export function logHistory() {
    const operation = ([row, text]) => `${row}=${text === '' ? '""' : text}`;
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

    entries = entries.filter(([row, text]) => lines[row] !== text);
    const dictionary = Object.fromEntries(entries);
    entries = Object.entries(dictionary);

    const prevSize = history[historyIndex - 1]?.size;
    if (size === prevSize && !entries.length) return;

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

export function setTerminalSelection(start, end, dir) {
    element.setSelectionRange(start, end, dir);
}
