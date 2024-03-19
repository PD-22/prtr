import {
    applyEntries,
    applySnapshot,
    clamp,
    generateSnapshot,
    getLines,
    getSelection,
    history,
    latestSize,
    latestText,
    lockedLines,
    maxHistoryLength,
    parseSnapshot,
    setSelection,
    setValue,
    settleInput,
    state
} from "./index.js";

export function pushHistory(snapshotDict) {
    const snapshot = generateSnapshot(snapshotDict);

    const prevSize = latestSize(state.historyIndex);
    const { size, entries } = parseSnapshot(snapshot);
    if (size === prevSize && !entries.length) return;

    history.splice(state.historyIndex + 1, Infinity, snapshot);

    const overflow = history.length - maxHistoryLength;
    if (overflow > 0) {
        const snaps = history.splice(0, overflow);
        snaps.forEach(snap => state.historyBase = applyEntries(snap, state.historyBase).join('\n'));
        state.historyIndex -= overflow;
    }

    return true;
}

export function undoHistory() {
    const newIndex = state.historyIndex - 1;

    if (newIndex < -1) { return restore(); }
    if (state.inputLoading) { return settleInput(); }

    state.historyIndex = clamp(newIndex, -1);

    setValue(revertLines(newIndex).join('\n'));

    const snapshot = history[newIndex];
    const { start, end, dir } = parseSnapshot(snapshot);
    if (start) setSelection(start, end, dir);
}

function revertLines(index = state.historyIndex - 1) {
    const { entries, lines } = parseSnapshot(history[index + 1]);
    const changedRows = new Map(entries);
    return Array.from({ length: latestSize(index) }, (v, row) => {
        if (!changedRows.has(row)) return lines[row] ?? latestText(row, index);
        return latestText(row, index);
    });
}

export function redoHistory(skipSelection) {
    const newIndex = state.historyIndex + 1;
    state.historyIndex = clamp(newIndex, -1, history.length - 1);

    if (state.inputLoading) return;
    if (newIndex > history.length - 1) return restore();
    applySnapshot(history[state.historyIndex], null, skipSelection);
}

export function restore(skipSelection, skipLock) {
    const snapshot = history[state.historyIndex];
    const selection = skipSelection ? getSelection() : parseSnapshot(snapshot);
    const { start, end, dir } = selection;

    const lines = getLines(true);
    const newLines = skipLock ? lines : lines.map(
        (text, row) => lockedLines.get(row)?.line ?? text
    );

    setValue(newLines.join('\n'));
    setSelection(start, end, dir);
}
