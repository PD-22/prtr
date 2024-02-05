/** @type {HTMLTextAreaElement} */
const element = document.querySelector('textarea.terminal');
const history = [{ value: '', start: 0, end: 0 }];
const maxHistoryLength = 128;
const inputDebounce = 500;
let historyIndex = 0;
let debounceId;
export const terminal = { element, isOpen: false };

export function openTerminal() {
    terminal.isOpen = true;
    element.classList.add('is-open');
    setTimeout(() => element.focus());
}

export function closeTerminal() {
    terminal.isOpen = false;
    element.classList.remove('is-open');
}

export function getTerminalValue() {
    return element.value;
}

function setTerminalValue(newValue) {
    return element.value = newValue;
}

export function writeTerminal(value, selection) {
    cancelInputHistory();
    pushHistory(value, selection);
    checkoutTerminalHistory(true);
}

export function onTerminalInput() {
    cancelInputHistory();
    debounceId = window.setTimeout(() => {
        const value = getTerminalValue();
        writeTerminal(value, getTerminalSelection());
    }, inputDebounce);
}
function cancelInputHistory() {
    return window.clearTimeout(debounceId);
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

export function checkoutTerminalHistory(direction = false) {
    const change = direction ? 1 : -1;
    const newHistoryIndex = clamp(historyIndex + change, 0, history.length - 1);

    historyIndex = newHistoryIndex;
    const { value, start, end, dir } = history[historyIndex];
    setTerminalValue(value);
    setTerminalSelection(start, end, dir);
}

export function logHistory() {
    const curValStr = JSON.stringify(getTerminalValue());
    const formatSnap = ({ value, start, end, dir }, i) => {
        const isActive = i === historyIndex;
        const valStr = JSON.stringify(value);
        if (isActive && valStr !== curValStr) console.warn('Text content does not match');
        const possArrow = isActive ? '<--' : '';
        return [
            i,
            valStr.padEnd(9, ' '),
            [start, end, dir].map(x => x ?? '?').join('-'),
            possArrow
        ].join(' ');
    };
    window.electron.status('History', history.map(formatSnap));
}

export function getTerminalLines(value = getTerminalValue()) {
    return value.replace(/\r/g, "\n").split('\n');
}

export function writeTerminalLines(lines, selection) {
    return writeTerminal(lines.join('\n'), selection);
}

export function writeTerminalLine(index, line, selection) {
    const lines = getTerminalLines();
    lines[index] = line;
    return writeTerminal(lines.join('\n'), selection);
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
