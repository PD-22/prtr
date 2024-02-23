import { remindShortcuts } from "./shortcuts.js";
import {
    closeTerminal,
    getTerminalLines,
    getTerminalSelection,
    lockTerminalLine,
    logHistory,
    openTerminal,
    posToCaret,
    redoTerminalHistory,
    setTerminalSelection,
    terminal,
    undoTerminalHistory,
    unlockTerminalLine,
    writeTerminalLine,
    writeTerminalText
} from "./terminal.js";

export default [
    ['Alt+/', 'Shortcuts', () => remindShortcuts()],
    ['Tab', 'Close', () => closeTerminal()],
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
        const newLines = parsedLines.map(x => fkv(x.username, x.data));
        writeTerminalText(newLines.join('\n'), null, null, true);
    }],
    ['Alt+Shift+C', 'Clear', () => {
        const parsedLines = parseLines(getTerminalLines());
        const newLines = parsedLines.map(x => x.username);
        writeTerminalText(newLines.join('\n'), null, null, true);
    }],

    [['Ctrl+Z', 'Meta+Z'], 'Undo', () => undoTerminalHistory()],
    [['Ctrl+Y', 'Meta+Y', 'Ctrl+Shift+Z', 'Meta+Shift+Z'], 'Redo', () => redoTerminalHistory()],

    ['Ctrl+Shift+ArrowUp', 'Ascending', () => sortData()],
    ['Ctrl+Shift+ArrowDown', 'Descending', () => sortData(false)],

    ['Ctrl+H', 'History', () => logHistory()],
    ['Ctrl+T', 'Selection', () => {
        const { start, end, dir, caret } = getTerminalSelection();
        const lines = getTerminalLines();
        const startCaret = posToCaret(lines, start[0], start[1]);
        const endCaret = posToCaret(lines, end[0], end[1]);
        const result = { startCaret, endCaret, dir, caret };
        const posStr = [start, end].map(x => x.join(':')).join('-');
        console.log(posStr, result);
    }],
    ['Ctrl+L', 'Wipe', () => console.clear()],
];

function moveLines(change) {
    const lines = getTerminalLines();
    let { start, end, dir } = getTerminalSelection();
    const [startRow, startCol] = start;
    const [endRow, endCol] = end;

    const newStartRow = startRow + change;
    const newEndRow = endRow + change;
    if (newStartRow < 0 || newEndRow >= lines.length) return;

    const movedLines = lines.splice(startRow, endRow - startRow + 1);
    lines.splice(newStartRow, 0, ...movedLines);
    start = [newStartRow, startCol];
    end = [newEndRow, endCol];
    writeTerminalText(lines.join('\n'), { start, end, dir });
}

function sortData(ascending = true) {
    const parsedLines = parseLines(getTerminalLines());
    const sorted = parsedLines
        .sort((a, b) => a.username.localeCompare(b.username))
        .sort((a, b) => (b.data ?? 0) - (a.data ?? 0));
    if (!ascending) sorted.reverse();
    const lines = sorted.map(x => x.line);
    writeTerminalText(lines.join('\n'), null, null, true);
}

async function scrape(removeData = false) {
    const parsedLines = parseLines(getTerminalLines());
    const lines = parsedLines.map(x => fkv(x.username, x.data));
    window.electron.status('Scrape: INIT', lines);
    writeTerminalText(lines.join('\n'), null, null, true);

    const filteredLines = parsedLines
        .map((o, index) => ({ ...o, index }))
        .filter(o => removeData || !o.data);

    if (!filteredLines.length) return window.electron.status("Scrape: EMPTY");

    window.electron.status('Scrape: START', filteredLines.map(x => x.username));
    await Promise.allSettled(filteredLines.map(async ({ username, index }) => {
        const write = (line, skipHistory) => writeTerminalLine(line, index, skipHistory, true);

        try {
            write(fkv(username, '...'), true);
            lockTerminalLine(index, () => window.electron.abortScrape(index));

            const data = await window.electron.scrape(index, username);
            if (data == null) throw Error('Scrape failed');

            window.electron.status(`Scrape: ${fkv(username, data)}`);
            unlockTerminalLine(index);
            write(fkv(username, data));
        } catch (error) {
            window.electron.status(`Scrape: ${fkv(username, 'ERROR')}`);
            write(username, true);
        } finally {
            unlockTerminalLine(index);
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
    return v != null ? `${k} - ${v}` : k;
}

function whitespace(str) {
    return str.trim().replace(/\s+/g, ' ');
}
