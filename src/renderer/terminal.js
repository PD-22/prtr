const element = document.querySelector('.terminal');
export const terminal = { element, isOpen: false };

window.electron.onScrapeTesseractConfirm(parsedLines => {
    openTerminal(parsedLines.join('\n'));
});

export function openTerminal(value) {
    terminal.isOpen = true;
    if (value != undefined) element.value = value;
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
