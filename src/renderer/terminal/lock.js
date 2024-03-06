import { getLine, lockedLines, getLines, setValue } from "../terminal.js";

export function lockLine(row, onPrevent) {
    const line = getLine(row);
    lockedLines.set(row, { line, onPrevent });
}

export function unlockLine(row) { lockedLines.delete(row); }

export function getLockedLines() { return new Map(lockedLines); }

export function getAbortRows(newLines = getLines()) {
    const format = ([row, { line, onPrevent }]) => [row, line, onPrevent];
    const rowChanged = ([row, line]) => newLines[row] !== line;
    return Array.from(lockedLines).map(format).filter(rowChanged);
}

export function abortLockedLine(newLines) {
    const abortRows = getAbortRows(newLines);
    const lines = getLines();
    abortRows.forEach(([row, line]) => lines[row] = line);

    setValue(lines.join('\n'), true);

    abortRows.forEach(([, , onPrevent]) => onPrevent?.());
    return Boolean(abortRows.length);
}
