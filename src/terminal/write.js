import {
    applySnapshot,
    generateSnapshot,
    commitInput,
    abortLockedLine,
    applyEntries,
    pushHistory,
    redoHistory,
    getLines,
    parseSnapshot,
    latestSize,
    state,
    caretToPos
} from "./index.js";

function write(snapshotDict, skipHistory, skipSelection) {
    if (skipHistory) return applySnapshot(generateSnapshot(snapshotDict), null, skipSelection);
    commitInput();
    if (abortLockedLine(applyEntries(snapshotDict))) return;
    if (!pushHistory(snapshotDict)) return;
    redoHistory(skipSelection);
}

export function writeLine(text, row, skipHistory, skipSelection) {
    row ??= getLines().length;
    return writeLines({ [row]: text }, skipHistory, skipSelection);
}

export function writeLines(rowTextDict, skipHistory, skipSelection) {
    const lines = getLines();
    const changesRow = ([row, text]) => lines[row] !== text;
    const entries = parseSnapshot(rowTextDict).entries.filter(changesRow);

    const prevSize = latestSize(state.historyIndex);
    const size = Math.max(prevSize, ...entries.map(([row]) => row + 1));

    const newDict = Object.fromEntries(fillSnaps(entries).concat(entries));
    write({ size, ...newDict }, skipHistory, skipSelection);
}

/** @param {[Number, any][]} rowTextPairs */
function fillSnaps(rowTextPairs) {
    const lines = getLines();
    const end = Math.max(...rowTextPairs.map(([row]) => row));
    const length = end - lines.length;
    const mapfn = (_, i) => [lines.length + i, ''];
    return Array.from({ length }, mapfn);
}

export function writeText(text, selection, skipHistory, skipSelection) {
    const { start, end, dir } = selection ?? {};
    const lines = getLines(text);
    const size = lines.length;
    const dictionary = Object.fromEntries(lines.map((text, row) => [row, text]));
    write({ size, start, end, dir, ...dictionary }, skipHistory, skipSelection);
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