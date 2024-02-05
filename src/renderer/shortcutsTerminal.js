import { remindShortcuts } from "./shortcuts.js";
import {
    posToCaret,
    checkoutTerminalHistory,
    closeTerminal,
    getTerminalLines,
    getTerminalSelection,
    logHistory,
    openTerminal,
    caretToPos,
    setTerminalSelection,
    terminal,
    writeTerminalLine,
    writeTerminalLines
} from "./terminal.js";

export default [
    ['Alt+/', 'Shortcuts', remindShortcuts],
    ['Tab', 'Close', closeTerminal],
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

    ['Escape', 'Deselect', () => {
        const { caret } = getTerminalSelection();
        setTerminalSelection(caret, caret);
    }],

    ['Alt+ArrowUp', 'Up', () => moveLines(-1)],
    ['Alt+ArrowDown', 'Down', () => moveLines(1)],
    ['Alt+C', 'Clean', () => {
        const parsedLines = parseLines(getTerminalLines());
        writeTerminalLines(parsedLines.map(x => fkv(x.username, x.data)));
    }],
    ['Alt+Shift+C', 'Clear', () => {
        const parsedLines = parseLines(getTerminalLines());
        writeTerminalLines(parsedLines.map(x => x.username));
    }],

    [['Ctrl+Z', 'Meta+Z'], 'Undo', () => checkoutTerminalHistory(false)],
    [['Ctrl+Y', 'Meta+Y', 'Ctrl+Shift+Z', 'Meta+Shift+Z'],
        'Redo', () => checkoutTerminalHistory(true)
    ],

    ['Ctrl+H', 'History', logHistory],
    ['Ctrl+Shift+ArrowUp', 'Ascending', () => sortData()],
    ['Ctrl+Shift+ArrowDown', 'Descending', () => sortData(false)]
];

function moveLines(change) {
    const lines = getTerminalLines();
    const { start, end } = getTerminalSelection();
    const [startRow] = caretToPos(lines, start);
    const [endRow] = caretToPos(lines, end);

    const newStartRow = startRow + change;
    const newEndRow = endRow + change;
    if (newStartRow < 0 || newEndRow >= lines.length) return;

    const movedLines = lines.splice(startRow, endRow - startRow + 1);
    lines.splice(newStartRow, 0, ...movedLines);
    const newStart = posToCaret(lines, newStartRow, 0);
    const newEnd = posToCaret(lines, newEndRow, Infinity);
    writeTerminalLines(lines, { start: newStart, end: newEnd });
}

function sortData(ascending = true) {
    const parsedLines = parseLines(getTerminalLines());
    const sorted = parsedLines
        .sort((a, b) => a.username.localeCompare(b.username))
        .sort((a, b) => (b.data ?? 0) - (a.data ?? 0));
    if (!ascending) sorted.reverse();
    const lines = sorted.map(x => x.line);
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
        try {
            writeTerminalLine(index, fkv(username, '...'), true);
            const newData = await window.electron.scrape(username);
            if (newData == null) throw new Error('User data not found');

            window.electron.status(`Scrape: ${fkv(username, newData)}`);
            writeTerminalLine(index, fkv(username, newData), true);
        } catch (error) {
            window.electron.status(`Scrape: FAIL: ${username}`);
            writeTerminalLine(index, username, true);
            throw error;
        }
    }));

    if (terminal.isOpen) return;
    openTerminal();
}

function parseLines(lines) {
    const mappedLines = lines.map(line => {
        const [username, data] = parseUser(line);
        return { username, data, line };
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
