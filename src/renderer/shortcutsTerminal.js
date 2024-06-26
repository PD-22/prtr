import {
    getLines,
    getSelection,
    redoHistory,
    setSelection,
    undoHistory,
    writeText
} from "../terminal/index.js";
import scrape, { cancelScrape as cancel } from "./scrape.js";

export default [
    ['Escape', 'Esc', 'Cancel', () => deselect() || cancel()],
    ['Enter', 'Enter', 'Search', scrape],
    ['Ctrl+Delete', 'Ctrl+Del', 'Clean', () => cancel() | clean()],

    [['Ctrl+KeyZ'], null, null, () => undoHistory()],
    [['Ctrl+KeyY', 'Ctrl+Shift+KeyZ'], null, null, () => redoHistory()],

    ['Ctrl+ArrowDown', null, null, () => cancel() | sortData(true)],
    ['Ctrl+ArrowUp', null, null, () => cancel() | sortData(false)],

    ['Alt+ArrowUp', null, null, () => moveLines(-1)],
    ['Alt+ArrowDown', null, null, () => moveLines(+1)],
    ['Ctrl+KeyL', null, null, () => console.clear()],
];

function clean() {
    const parsedLines = getParsedLines();
    const newLines = unique(parsedLines.map(x => x.username).filter(Boolean));
    writeText(newLines.join('\n'), undefined, undefined, true);
}

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
    const parsedLines = getParsedLines().filter(x => x.line);
    const sorted = parsedLines
        .sort((a, b) => (a.username ?? '').localeCompare(b.username ?? ''))
        .sort((a, b) => (b.data ?? 0) - (a.data ?? 0));
    if (!ascending) sorted.reverse();
    const lines = sorted.map(x => x.line);
    writeText(lines.join('\n'), undefined, undefined, true);
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

function deselect() {
    const selection = getSelection();
    const [x, y] = selection.start;
    const [x2, y2] = selection.end;
    if (x === x2 && y === y2) return;

    setSelection(selection.caret);
    return true;
}
