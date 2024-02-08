/** @type {HTMLTextAreaElement} */
const element = document.querySelector('textarea.terminal');
const history = [{ value: '', start: 0, end: 0 }];
const maxHistoryLength = 128;
const inputDebounce = 500;
let inputLoading = false;
const lockedLines = new Set();
let historyIndex = 0;
let debounceId;
export const terminal = { element, isOpen: false };

export function openTerminal() {
    terminal.isOpen = true;
    element.classList.add('is-open');
    setTimeout(() => element.focus());
}

export function closeTerminal() {
    commitInputHistory();
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
    return element.value = newValue;
}

export function writeTerminal(value, selection, overrideBlock) {
    commitInputHistory();
    if (!overrideBlock && abortCorruptedLines(value)) return checkoutTerminalHistory(0);
    pushHistory(value, selection);
    redoTerminalHistory();
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
    cancelInputHistory();
    if (abortCorruptedLines(getTerminalValue())) return checkoutTerminalHistory(0);
    inputLoading = true;
    debounceId = setTimeout(commitInputHistory, inputDebounce);
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

function pushHistory(value, selection) {
    let { start, end, dir } = parseSelection(value, selection);

    const spliceIndex = historyIndex + (value !== history[historyIndex].value);
    const snapshot = { value, start, end, dir };
    history.splice(spliceIndex, Infinity, snapshot);

    const overflow = history.length - maxHistoryLength;
    if (overflow > 0) history.splice(0, overflow);
}

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
    return checkoutTerminalHistory(-1);
}
export function redoTerminalHistory() {
    return checkoutTerminalHistory(1);
}

export function logHistory() {
    const arrow = '-->';
    const indent = ' '.repeat(arrow.length + 1);
    const curValStr = JSON.stringify(getTerminalValue());
    const formatSnap = ({ value, start, end, dir }, index) => {
        const isActive = index === historyIndex;
        const valStr = JSON.stringify(value);
        // if (isActive && valStr !== curValStr) console.warn('Text content does not match');
        const arrowStr = (isActive ? arrow : '').padEnd(arrow.length, ' ');
        const indexStr = `${index}:`;
        const startStr = String(start).padStart?.(2, '0');
        const endStr = String(end).padStart?.(2, '0');
        const selectStr = [startStr, endStr, dir?.[0]].map(x => x ?? '?').join('-');
        return [arrowStr, indexStr, selectStr, valStr,].join(' ');
    };
    const body = ['History', indent + curValStr, ...history.map(formatSnap)];
    window.electron.status(body.join('\n'));
}

export function getTerminalLines(value = getTerminalValue()) {
    return value.replace(/\r/g, "\n").split('\n');
}

export function writeTerminalLines(lines, selection, overrideBlock) {
    return writeTerminal(lines.join('\n'), selection, overrideBlock);
}

export function writeTerminalLine(index, line, selection, overrideBlock) {
    const lines = getTerminalLines();
    lines[index] = line;
    return writeTerminal(lines.join('\n'), selection, overrideBlock);
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
