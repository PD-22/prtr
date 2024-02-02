/** @type {HTMLTextAreaElement} */
const element = document.querySelector('textarea.terminal');
const history = [];
let historyIndex = 0;
const historyMaxSize = 8;
export const terminal = { isOpen: false };

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

export function setTerminalValue(newValue) {
    return element.value = newValue;
}

export function writeTerminal(newValue) {
    if (getTerminalValue() === newValue) return;
    pushHistory();
    setTerminalValue(newValue);
    logHistory();
}

function pushHistory() {
    const currentValue = getTerminalValue();

    const { start, end, dir } = getTerminalSelection();
    const snapshot = { value: currentValue, start, end, dir };
    history.splice(clamp(historyIndex, 1, Infinity), Infinity, snapshot);

    const overflow = history.length - historyMaxSize;
    if (overflow > 0) history.splice(0, overflow);

    historyIndex = history.length;
}

export function checkoutTerminalHistory(change) {
    const newHistoryIndex = clamp(historyIndex + change, 0, history.length - 1);
    if (newHistoryIndex === historyIndex) return;

    if (historyIndex >= history.length) pushHistory();

    historyIndex = newHistoryIndex;
    const { value, start, end, dir } = history[historyIndex];
    setTerminalValue(value);
    setTerminalSelection(start, end, dir);

    logHistory();
}

function logHistory() {
    const dictLines = dict => Object.entries(dict).map(entry => entry.join(': ')).join(' | ');

    const body = [
        dictLines({ historyIndex, length: history.length }),
        ...history.map((snapshot, index) => {
            const { start, end, dir } = snapshot;
            const startPos = getTerminalPos(start);
            const endPos = getTerminalPos(end);
            return [
                dictLines({ index, startPos, endPos, dir }),
                JSON.stringify(snapshot.value)
            ];
        }).flat(),
    ];
    window.electron.status('History', body);
}

export function getTerminalLines() {
    return getTerminalValue().replace(/\r/g, "\n").split('\n');
}

export function writeTerminalLines(lines) {
    return writeTerminal(lines.join('\n'));
}

export function writeTerminalLine(index, line) {
    const lines = getTerminalLines();
    lines[index] = line;
    return writeTerminal(lines.join('\n'));
}

export function getTerminalPos(caret) {
    const lines = getTerminalLines();
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

export function getTerminalCaret(row, col = 0) {
    const lines = getTerminalLines();
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

export function setTerminalSelectionPos(startRow, startCol, endRow, endCol, dir) {
    const start = getTerminalCaret(startRow, startCol);
    const end = getTerminalCaret(endRow, endCol);
    element.setSelectionRange(start, end, dir);
}
