import {
    applySnapshot,
    generateSnapshot,
    commitInput,
    abortLockedLines,
    applyEntries,
    pushHistory,
    redoHistory,
    getLines,
    parseSnapshot,
    latestSize,
    state,
    caretToPos
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
    commitInput();
    const lines = getLines();
    const changesRow = ([row, text]) => lines[row] !== text;
    const entries = parseSnapshot(rowTextDict).entries.filter(changesRow);

    const prevSize = latestSize(state.historyIndex);
    const size = Math.max(prevSize, ...entries.map(([row]) => row + 1));

    const newDict = Object.fromEntries(fillSnaps(entries).concat(entries));
    write({ size, ...newDict }, skipHistory, skipSelection, skipLock);
}

/** @param {[Number, any][]} rowTextPairs */
function fillSnaps(rowTextPairs) {
    const lines = getLines();
    const end = Math.max(...rowTextPairs.map(([row]) => row));
    const length = end - lines.length;
    const mapfn = (_, i) => [lines.length + i, ''];
    return Array.from({ length }, mapfn);
}

export function writeText(text, selection, skipHistory, skipSelection, skipLock) {
    commitInput();
    const { start, end, dir } = selection ?? {};
    const lines = getLines(text);
    const size = lines.length;
    const dictionary = Object.fromEntries(lines.map((text, row) => [row, text]));
    write({ size, start, end, dir, ...dictionary }, skipHistory, skipSelection, skipLock);
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
