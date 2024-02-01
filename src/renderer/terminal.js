/** @type {HTMLTextAreaElement} */
const element = document.querySelector('textarea.terminal');
const history = [];
let historyIndex = 0;
const histroyMaxSize = 3;
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

export function writeTerminal(text) {
    if (element.value === text) return; // abort: no changes
    element.value = text;
    pushTerminalHistory();
}

function formatHistory() {
    return history
        .map((x, i) => `${historyIndex === i ? '<--\n' : ''}${x.value}`)
        .join('\n\n')
        .split('\n')
}

export function pushTerminalHistory() {
    const lastHistory = history[history.length - 1];
    const value = element.value;
    if (value === lastHistory?.value) return; // abort: duplicate history

    // replace future history with new snapshot
    const snapshot = { ...getTerminalSelection(), value };
    history.splice(historyIndex + 1, Infinity, snapshot);

    // limit history from end
    const overflow = history.length - histroyMaxSize;
    if (history.length > 0) history.splice(0, overflow);

    // move history index to end
    historyIndex = history.length - 1;

    window.electron.status('History', formatHistory()); // log history with markers
}

export function undoTerminalHistory() {
    window.electron.status('Terminal: Undo');

    const prevIndex = historyIndex - 1;
    const prevSnapshot = history[prevIndex];

    if (!prevSnapshot) return; // abort: empty

    // restore index, text, selection
    historyIndex = prevIndex;
    const { value, start, end, dir } = prevSnapshot;
    element.value = value;
    setTerminalSelection(start, end, dir);

    window.electron.status('History', formatHistory()); // log history with markers
}

// TODO
export function redoTerminalHistory() {
    window.electron.status('Terminal: Redo');
}

export function getTerminalLines() {
    return element.value.replace(/\r/g, "\n").split('\n');
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
