import { getLines, setSelection, setValue } from './index.js';

export function applySnapshot(snapshot, value, skipSelection) {
    let { start, end, dir } = parseSnapshot(snapshot);

    setValue(applyEntries(snapshot, value).join('\n'), skipSelection);
    if (skipSelection) return;
    setSelection(start, end, dir);
}

export function applyEntries(snapshot, value) {
    const lines = getLines(value);
    const { size, entries } = parseSnapshot(snapshot);
    entries.forEach(([row, text]) => lines[row] = text);
    lines.length = size;
    return lines;
}

export function parseSnapshot(snapshot = {}, value) {
    const intKey = ([row, text]) => [parseInt(row), text];
    const isValidRow = ([row]) => Number.isInteger(row) && row >= 0;
    const byFirst = (a, b) => a[0] - b[0];

    const { size, start, end, dir, ...dict } = snapshot;
    const entries = Object.entries(dict).map(intKey).filter(isValidRow).toSorted(byFirst);
    const lines = getLines(value);
    const newValue = lines.join('\n');
    return { size, start, end, dir, entries, lines, value: newValue };
}

export function generateSnapshot(dict, value) {
    let { size, start, end, dir, entries, lines } = parseSnapshot(dict, value);

    const filteredEntries = entries.filter(([row, text]) => lines[row] !== text);
    const dictionary = Object.fromEntries(filteredEntries);
    const cleanEntries = parseSnapshot(dictionary).entries;

    end ??= start;
    if (start == undefined) {
        const newLines = applyEntries({ size, ...dictionary });
        const rows = cleanEntries.map(([row]) => row);
        const lastRow = rows.length ? Math.max(...rows) : size - 1;
        start = end = [lastRow, newLines[lastRow].length];
    }

    return { size, start, end, dir, ...dictionary };
}
