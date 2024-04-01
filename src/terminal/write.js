import {
    abortLockedLines,
    applyEntries,
    applySnapshot,
    caretToPos,
    commitInput,
    generateSnapshot,
    getLines,
    pushHistory,
    redoHistory
} from "./index.js";

function write(snapshotDict, skipHistory, skipSelection, skipLock) {
    if (skipHistory) return applySnapshot(generateSnapshot(snapshotDict), null, skipSelection);
    commitInput();
    if (abortLockedLines(applyEntries(snapshotDict)) && !skipLock) return;
    if (!pushHistory(snapshotDict)) return;
    redoHistory(skipSelection);
}

export function writeLine(text, row, skipHistory, skipSelection, skipLock) {
    row ??= getLines().length;
    return writeLines({ [row]: text }, skipHistory, skipSelection, skipLock);
}

export function writeLines(rowTextDict, skipHistory, skipSelection, skipLock) {
    const lines = getLines();
    Object.entries(rowTextDict).forEach(([row, text]) => lines[row] = text);
    const value = Array.from(lines).map(x => x ?? '').join('\n');
    return writeText(value, undefined, skipHistory, skipSelection, skipLock);
}

export function writeText(text, selection, skipHistory, skipSelection, skipLock) {
    const { start, end, dir } = selection ?? {};
    const lines = getLines(text);
    const size = lines.length;
    const dictionary = Object.fromEntries(lines.map((text, row) => [row, text]));
    const snapshotDict = { size, start, end, dir, ...dictionary };
    write(snapshotDict, skipHistory, skipSelection, skipLock);
}

export function removeLines(startRow, endRow = startRow + 1, skipHistory) {
    const lines = getLines();
    if (startRow < 0 || endRow > lines.length) return;
    const deleteCount = Math.max(0, endRow - startRow);
    const newLines = lines.toSpliced(startRow, deleteCount);

    const endCaret = caretToPos(newLines, Infinity);
    const caret = startRow === newLines.length ? endCaret : [startRow, 0];

    writeText(newLines.join('\n'), { start: caret, end: caret }, skipHistory);
}
