import {
    clearHistory,
    getLines,
    getSelection,
    logHistory,
    redoHistory,
    setSelection,
    undoHistory,
    writeText
} from "../terminal/index.js";
import scrape from "./scrape.js";

export default [
    ['Enter', 'Scrape', scrape],

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

export function getParsedLines() {
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

function whitespace(str) {
    return str.trim().replace(/\s+/g, ' ');
}
