/** @type {HTMLTextAreaElement} */
const element = document.querySelector('textarea.terminal');
const history = [];
const histroyMaxSize = 4;
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
    if (element.value === text) return;
    pushTerminalHistory(text);
    element.value = text;
}

export function pushTerminalHistory() {
    const initLength = history.length;
    const lastHistory = history[history.length - 1];
    const value = element.value;
    if (value === lastHistory?.value) return;

    const newItem = { ...getTerminalSelection(), value };
    history.push(newItem);

    const overflow = history.length - histroyMaxSize;
    if (history.length > 0) history.splice(0, overflow);

    if (initLength === history.length) return;
    window.electron.status(`History: ${history.length}`);
}

export function popTerminalHistory() {
    const initLength = history.length;
    if (!history.length) return;
    const { value, start, end, dir } = history.pop();
    element.value = value;
    setTerminalSelection(start, end, dir);

    if (initLength === history.length) return;
    window.electron.status(`History: ${history.length}`);
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
