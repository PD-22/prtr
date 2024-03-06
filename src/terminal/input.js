import {
    state,
    getSelection,
    abortLockedLine,
    inputDebounce,
    getValue,
    restore,
    setSelection,
    element,
    writeText
} from "../terminal.js";

export function onInput() {
    cancelInput();
    state.inputLoading = true;
    state.lastOnInputSelection = getSelection();

    if (abortLockedLine()) return;

    state.inputTimer = setTimeout(commitInput, inputDebounce);
}

export function commitInput() {
    if (!state.inputLoading) return;
    cancelInput();
    const text = getValue();
    const selection = getSelection();
    restore();
    writeText(text, state.lastOnInputSelection);
    const { start, end, dir } = selection;
    setSelection(start, end, dir);
}

export function settleInput(skipSelection) {
    cancelInput();
    restore(skipSelection);
}

export function mockInput(text, selection, preCommit) {
    element.value = text;
    const { start, end, dir } = selection ?? {};
    setSelection(start, end, dir);
    onInput();
    if (preCommit?.(cancelInput) === false) return;
    commitInput();
}

function cancelInput() {
    state.inputLoading = false;
    return clearTimeout(state.inputTimer);
}
