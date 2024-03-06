import {
    getSelection,
    getValue,
    history,
    lockedLines,
    parseSnapshot,
    state
} from "./index.js";

export function logHistory() {
    const operation = ([row, text]) => `${row}=${text.length === 1 ? text : `"${text}"`}`;
    const indent = ' '.repeat(2);
    const sel = ({ start, end, dir }) => {
        const diff = JSON.stringify(start) !== JSON.stringify(end);
        const list = [start, diff && end, dir?.[0]];
        return list.filter(Boolean).join('-');
    };
    const snapshot = (s, i) => {
        const { size, start, end, dir, entries } = parseSnapshot(s);
        const selStr = sel({ start, end, dir });
        const entriesStr = entries.map(operation).join(' ');
        return `${i}: size=${size} sel=${selStr} ${entriesStr}`;
    };
    const value = JSON.stringify(getValue());
    const valueStr = indent + `value: ${value}`;

    const selStr = indent + `sel: ${sel(getSelection())}`;

    const committed = JSON.stringify(getValue(true));
    const committedStr = value !== committed && (indent + `committed: ${committed}`);


    const base = `#: ${JSON.stringify(state.historyBase)}`;
    const historyStr = [base, ...history].map((s, i) => {
        const mid = --i === state.historyIndex ? '> ' : '  ';
        const end = i < 0 ? base : snapshot(s, i);
        return `${indent}${mid}${end}`;
    }).join('\n');

    const historyIndexStr = indent + `historyIndex: ${state.historyIndex}`;

    const lockedKeys = Array.from(lockedLines.keys());
    const locked = lockedKeys.length > 0 && (indent + `locked: ${lockedKeys}`);

    const logs = [
        `History:`, historyStr, historyIndexStr,
        valueStr, committedStr, selStr, locked
    ];
    console.log(logs.filter(Boolean).join('\n'));
}
