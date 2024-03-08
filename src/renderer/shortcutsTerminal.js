import {
    clearHistory,
    getLines,
    getSelection,
    lockLine,
    logHistory,
    open,
    redoHistory,
    setSelection,
    state,
    undoHistory,
    unlockLine,
    writeLine,
    writeText
} from "../terminal/index.js";

export default [
    ['Enter', 'Scrape', async () => {
        try {
            await scrape();
        } catch (error) {
            window.electron.status('Scrape: ERROR');
            throw error;
        }
    }],

    ['Alt+ArrowUp', 'Up', () => moveLines(-1)],
    ['Alt+ArrowDown', 'Down', () => moveLines(1)],
    ['Alt+C', 'Clean', () => {
        const parsedLines = getParsedLines();
        const newLines = unique(parsedLines.map(x => x.username).filter(Boolean));
        writeText(newLines.join('\n'), null, null, true);
    }],

    [['Ctrl+Z', 'Meta+Z'], 'Undo', () => undoHistory()],
    [['Ctrl+Y', 'Meta+Y', 'Ctrl+Shift+Z', 'Meta+Shift+Z'], 'Redo', () => redoHistory()],

    ['Ctrl+Shift+ArrowUp', 'Ascending', () => sortData()],
    ['Ctrl+Shift+ArrowDown', 'Descending', () => sortData(false)],

    ['Ctrl+H', 'History', () => logHistory()],
    ['Ctrl+Shift+H', 'Wipe', () => { clearHistory(); }],

    ['Escape', 'Deselect', () => { setSelection(getSelection().caret); }],
];

function moveLines(change) {
    const lines = getLines();
    let { start, end, dir } = getSelection();
    const [startRow, startCol] = start;
    const [endRow, endCol] = end;

    const newStartRow = startRow + change;
    const newEndRow = endRow + change;
    if (newStartRow < 0 || newEndRow >= lines.length) return;

    const movedLines = lines.splice(startRow, endRow - startRow + 1);
    lines.splice(newStartRow, 0, ...movedLines);
    start = [newStartRow, startCol];
    end = [newEndRow, endCol];
    writeText(lines.join('\n'), { start, end, dir });
}

function sortData(ascending = true) {
    const parsedLines = getParsedLines();
    const sorted = parsedLines
        .sort((a, b) => a.username.localeCompare(b.username))
        .sort((a, b) => (b.data ?? 0) - (a.data ?? 0));
    if (!ascending) sorted.reverse();
    const lines = sorted.map(x => x.line);
    writeText(lines.join('\n'), null, null, true);
}

async function scrape() {
    const parsedLines = getParsedLines();
    const lines = parsedLines.map(x => fkv(x.username, x.data));
    window.electron.status('Scrape: INIT', lines);
    writeText(lines.join('\n'), null, null, true);

    const filteredLines = parsedLines
        .map((o, index) => ({ ...o, index }))
        .filter(o => o.username && !o.data);

    if (!filteredLines.length) return window.electron.status("Scrape: EMPTY");

    window.electron.status('Scrape: START', filteredLines.map(x => x.username));
    await Promise.allSettled(filteredLines.map(
        ({ username, index }) => scrapeLine(username, index)
    ));

    if (state.isOpen) return;
    open();
}

async function scrapeLine(username, index) {
    const write = (line, skipHistory) => writeLine(line, index, skipHistory, true);

    try {
        write(fkv(username, '...'), true);
        lockLine(index, () => window.electron.abortScrape(index));

        const data = await window.electron.scrape(index, username);
        if (typeof data !== 'number') throw new Error('Scrape failed');
        if (data instanceof Error) throw data;

        window.electron.status(`Scrape: ${fkv(username, data)}`);
        unlockLine(index);
        write(fkv(username, data));
    } catch (error) {
        const isAbort = error.message === "Error invoking remote method 'scrape': abort";
        if (!isAbort) console.error(error);
        window.electron.status(`Scrape: ${fkv(username, isAbort ? 'ABORT' : 'ERROR')}`);

        unlockLine(index);
        write(username, true);
    } finally {
        unlockLine(index);
    }
}

function getParsedLines() {
    return getLines().map(line => {
        const { username, data } = parseUser(line) ?? [];
        return { username, data, line };
    });
}

export function parseUser(str) {
    const normal = whitespace(str);

    const match = normal.match(/(^|\s+)-($|\s+)/);
    let user, data;
    if (match) {
        user = normal.slice(0, match.index);
        data = normal.slice(match.index + match[0]?.length);
    } else {
        user = normal;
    }

    const segments = user.split(' ');
    let tag, username;
    if (segments.length <= 1) {
        username = segments[0];
    } else {
        const [first, ...rest] = segments;
        tag = first;
        username = rest.join('');
    }

    tag ||= null; username ||= null; data ||= null;

    return { tag, username, data };
}

function unique(arr, getKey = x => x) {
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
