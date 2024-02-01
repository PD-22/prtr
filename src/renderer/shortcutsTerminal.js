import { remindShortcuts } from "./shortcuts.js";
import { clamp, closeTerminal, getTerminalCaret, getTerminalLines, getTerminalPos, getTerminalSelection, openTerminal, redoTerminalHistory, setTerminalSelection, terminal, undoTerminalHistory, writeTerminalLine, writeTerminalLines } from "./terminal.js";

export default [
    ['Enter', 'Scrape', async () => {
        try {
            await scrape();
        } catch (error) {
            window.electron.status('Scrape: ERROR');
            throw error;
        }
    }],
    ['Alt+Enter', 'Rescrape', async () => {
        try {
            await scrape(true);
        } catch (error) {
            window.electron.status('Scrape: ERROR');
            throw error;
        }
    }],
    ['Alt+ArrowUp', 'Up', () => moveLine(-1)],
    ['Alt+ArrowDown', 'Down', () => moveLine(1)],
    ['Alt+C', 'Clean', () => {
        const parsedLines = parseLines(getTerminalLines());
        writeTerminalLines(parsedLines.map(x => fkv(x.username, x.data)));
    }],

    ['Ctrl+Z', 'Undo', undoTerminalHistory],
    ['Meta+Z', 'Undo', undoTerminalHistory],
    ['Ctrl+Y', 'Redo', redoTerminalHistory],
    ['Meta+Y', 'Redo', redoTerminalHistory],
    ['Ctrl+Shift+Z', 'Redo', redoTerminalHistory],
    ['Meta+Shift+Z', 'Redo', redoTerminalHistory],

    ['Ctrl+Shift+ArrowUp', 'Ascending', () => sortData()],
    ['Ctrl+Shift+ArrowDown', 'Descending', () => sortData(false)],
    ['Escape', 'Close', () => {
        if (!terminal.isOpen) return;
        closeTerminal();
        remindShortcuts();
    }]
];

function moveLine(change) {
    const lines = getTerminalLines();
    const { caret } = getTerminalSelection();
    const [row] = getTerminalPos(caret);

    const newRow = clamp(row + change, 0, lines.length);
    if (newRow >= lines.length) return;
    [lines[row], lines[newRow]] = [lines[newRow], lines[row]];
    writeTerminalLines(lines);

    const newStart = getTerminalCaret(newRow, 0);
    const newEnd = getTerminalCaret(newRow, lines[newRow].length);
    setTerminalSelection(newStart, newEnd);
}

function sortData(ascending = true) {
    const parsedLines = parseLines(getTerminalLines());
    const sorted = parsedLines
        .sort((a, b) => a.username.localeCompare(b.username))
        .sort((a, b) => (b.data ?? 0) - (a.data ?? 0));
    if (!ascending) sorted.reverse();
    const lines = sorted.map(x => fkv(x.username, x.data));
    writeTerminalLines(lines);
}

async function scrape(removeData = false) {
    const parsedLines = parseLines(getTerminalLines());
    const lines = parsedLines.map(x => fkv(x.username, x.data));
    window.electron.status('Scrape: INIT', lines);
    writeTerminalLines(lines);

    const filteredLines = parsedLines
        .map((o, index) => ({ ...o, index }))
        .filter(o => removeData || !o.data);

    if (!filteredLines.length) return window.electron.status("Scrape: EMPTY");

    window.electron.status('Scrape: START');
    await Promise.allSettled(filteredLines.map(async ({ username, index }) => {
        writeTerminalLine(index, fkv(username, '...'));

        const newData = await window.electron.scrape(username);

        window.electron.status(`Scrape: ${fkv(username, newData ?? 'N/A')}`);
        writeTerminalLine(index, fkv(username, newData));
    }));

    if (terminal.isOpen) return;
    openTerminal();
    remindShortcuts();
}

function parseLines(lines) {
    const mappedLines = lines.map(line => {
        const [username, data] = parseUser(line);
        return { username, data };
    });

    const filteredLines = mappedLines.filter(x => x.username)

    return unique(filteredLines, x => x.username);
}

function parseUser(str) {
    const normal = whitespace(str);
    const match = normal.match(/^(.*?)((^|\s+)-\s*(\S*))?$/);
    const user = match?.[1];
    const data = match?.[4];

    if (!user) return [];

    const [first, ...rest] = user.split(' ');
    const username = rest.join('') || first;

    return [username, data];
}

function unique(arr, getKey) {
    const entries = arr.map((...args) => {
        const [v] = args;
        return [getKey(...args), v];
    });
    return Array.from(new Map(entries).values());
}

function fkv(k, v) {
    return v ? `${k} - ${v}` : k;
}

function whitespace(str) {
    return str.trim().replace(/\s+/g, ' ');
}
