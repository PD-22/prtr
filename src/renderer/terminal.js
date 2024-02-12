/** @type {HTMLTextAreaElement} */
const element = document.querySelector('textarea.terminal');

const history = [];
let historyBase = "X\nY\nZ\nA";
// let historyBase = "";
const maxHistoryLength = 18;
let historyIndex = 0;
setTerminalValue(historyBase);

const inputDebounce = 500;
let inputLoading = false;
const lockedLines = new Set();
let debounceId;
export const terminal = { element, isOpen: false };

const assert = (actual, expected) => {
    if (actual === expected) return;
    throw new Error(`expected ${expected} but got ${actual}`);
}
const _ = ([expected]) => {
    expected = JSON.stringify(expected.replaceAll(' ', '\n'));
    const actual = JSON.stringify(getTerminalValue());
    assert(actual, expected);
    logHistory();
};
openTerminal();                                             /**/_`X Y Z A`;
removeTerminalLines(3);                                     /**/_`X Y Z`;
writeTerminalLine('B', 0);                                  /**/_`B Y Z`;
writeTerminalLine('C', 1);                                  /**/_`B C Z`;
writeTerminalLines({ 0: 'D', 1: 'E', 2: 'F', 3: 'G' });     /**/_`D E F G`;
undoTerminalHistory();                                      /**/_`B C Z`;
undoTerminalHistory();                                      /**/_`B Y Z`;
undoTerminalHistory();                                      /**/_`X Y Z`;
undoTerminalHistory();                                      /**/_`X Y Z A`;
writeTerminalLine('B');                                     /**/_`X Y Z A B`;
removeTerminalLines(1);                                     /**/_`X Z A B`;
removeTerminalLines(2);                                     /**/_`X Z B`;
removeTerminalLines(0);                                     /**/_`Z B`;
undoTerminalHistory();                                      /**/_`X Z B`;
writeTerminalLine('T');                                     /**/_`X Z B T`;
writeTerminalLine('R');                                     /**/_`X Z B T R`;
undoTerminalHistory();                                      /**/_`X Z B T`;
removeTerminalLines(2);                                     /**/_`X Z T`;
writeTerminalLine("A", 0);                                  /**/_`A Z T`;
writeTerminalLine("B");                                     /**/_`A Z T B`;
writeTerminalLine("C");                                     /**/_`A Z T B C`;
removeTerminalLines(2);                                     /**/_`A Z B C`;
writeTerminalLine("B", 1);                                  /**/_`A B B C`;
writeTerminalLine("Q", 2);                                  /**/_`A B Q C`;
writeTerminalLines({ 0: 'C', 1: 'D', 2: 'E', 3: 'F' });     /**/_`C D E F`;
undoTerminalHistory();                                      /**/_`A B Q C`;
writeTerminalLines({ 0: 'X', 1: 'X', 2: 'X', 3: 'X' });     /**/_`X X X X`;
writeTerminalLines({ 2: 'C', 1: 'D', 0: 'E' });             /**/_`E D C X`;
writeTerminalLines({ 5: 'H', 7: 'J' });                     /**/_`E D C X\n H\n J`;
removeTerminalLines(4);                                     /**/_`E D C X H\n J`;
removeTerminalLines(6);                                     /**/_`E D C X H `;
removeTerminalLines(0, 2);                                  /**/_`C X H `;
removeTerminalLines(-2, 2);                                 /**/_`C X`;
writeTerminalLines({ 0: 'C', 1: 'X' });                     /**/_`C X`;
undoTerminalHistory();                                      /**/_`C X H `;
writeTerminalLines({ 0: 'C', 1: 'X', 2: 'H' });             /**/_`C X H `;

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

export function writeTerminal(value, selection, overrideBlock) {
    // commitInputHistory();
    // if (!overrideBlock && abortCorruptedLines(value)) return checkoutTerminalHistory(0);
    // pushHistory(value, selection);
    // redoTerminalHistory();
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
    const { size, ...snapshot } = history[historyIndex];
    const lines = getTerminalLines();

    parseSnapshot(snapshot).entries.forEach(operation => {
        const [row, text] = operation;
        lines[row] = text;
    });

    lines.length = size;
    setTerminalValue(lines.join('\n'));
    historyIndex++;
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

function pushHistory(snapshot) {
    const { size, ...newDict } = snapshot;

    const prevSize = history[historyIndex - 1]?.size;
    if (size === prevSize && !Object.entries(newDict).length) return;

    history.splice(historyIndex, Infinity, snapshot);

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
