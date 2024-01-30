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
    return element.value.split('\n');
}

export function writeTerminalLines(lines) {
    return writeTerminal(lines.join('\n'));
}

export function writeTerminalLine(index, line) {
    const lines = getTerminalLines();
    lines[index] = line;
    return writeTerminal(lines.join('\n'));
}
