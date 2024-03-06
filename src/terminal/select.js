import { element, getLines, getValue, clamp } from "./index.js";

export function getSelection() {
    const { selectionDirection, selectionStart, selectionEnd } = element;
    const caret = selectionDirection === 'forward' ? selectionEnd : selectionStart;
    const lines = getLines();
    const pos = caret => caretToPos(lines, caret);
    return {
        start: pos(selectionStart),
        end: pos(selectionEnd),
        caret: pos(caret),
        dir: selectionDirection
    };
}

export function setSelection(start, end, dir = undefined) {
    const lines = getLines();
    start ??= caretToPos();
    end ??= start;
    const caret = pos => posToCaret(lines, pos[0], pos[1]);
    setSelectionCaret(caret(start), caret(end), dir);
}

export function setSelectionCaret(start = getValue().length, end = start, dir = undefined) {
    element.setSelectionRange(start, end, dir);
}

export function caretToPos(lines = getLines(), caret = Infinity) {
    caret = clamp(caret, 0, lines.join('\n').length);
    let index = 0;
    let row;

    for (row = 0; row < lines.length; row++) {
        const line = lines[row];
        const length = line.length;
        const nextCount = index + length + 1;
        if (nextCount > caret) break;
        index = nextCount;
    }

    const col = caret - index;

    return [row, col];
}

export function posToCaret(lines = getLines(), row = Infinity, col = Infinity) {
    row = clamp(row, 0, lines.length - 1);
    col = clamp(col, 0, lines[row].length);

    const rows = lines.slice(0, row);
    const colLengths = rows.map(c => c.length);
    const lengths = colLengths.map((l, i, a) => l + (i < lines.length - 1 ? 1 : 0));

    return lengths.reduce((acc, len) => acc + len, col);
}
