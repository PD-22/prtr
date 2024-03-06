import { element, latestSize, latestText, state } from "../terminal.js";
import { getAbortRows } from "./lock.js";
import { getSelection, setSelection } from "./select.js";

export function getValue(commited = false) {
    return commited ? calculateLines().join('\n') : element.value;
}

function calculateLines(index = state.historyIndex) {
    return Array.from({ length: latestSize(index) }, (v, row) => latestText(row, index));
}

export function setValue(newValue, skipSelection) {
    if (getAbortRows(getLines(newValue)).length) throw new Error('Locked line');

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
