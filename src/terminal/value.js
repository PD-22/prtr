import {
    element,
    latestSize,
    latestText,
    state,
    getAbortRows,
    getSelection,
    setSelection
} from "./index.js";

export function getValue(commited = false) {
    return commited ? calculateLines().join('\n') : element.value;
}

function calculateLines(index = state.historyIndex) {
    return Array.from({ length: latestSize(index) }, (v, row) => latestText(row, index));
}

export function setValue(newValue, skipSelection) {
    if (getAbortRows(getLines(newValue)).length) return;

    if (!skipSelection) return element.value = newValue;

    const selection = getSelection();
    let { start, end, dir } = selection;
    element.value = newValue;
    setSelection(start, end, dir);
}

export function getLines(value) {
    if (typeof value !== 'string') value = getValue(value);
    return value.replace(/\r/g, "\n").split('\n');
}

export function getLine(row, value) {
    return getLines(value)[row];
}
