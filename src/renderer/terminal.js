const element = document.querySelector('.terminal');
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

export function writeTerminal(text) {
    element.value = text;
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

export function getTerminalCursor() {
    const lines = getTerminalLines();
    const cursor = getCursorPosition();
    let index = 0;
    let row;

    for (row = 0; row < lines.length; row++) {
        const line = lines[row];
        const length = line.length;
        const nextCount = index + length + 1;
        if (nextCount > cursor) break;
        index = nextCount;
    }

    const col = cursor - index;

    return [row, col];
}

export function getCursorPosition() {
    const { selectionDirection, selectionStart, selectionEnd } = terminal.element;
    return selectionDirection === 'forward' ? selectionEnd : selectionStart;
}
