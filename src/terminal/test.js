import shortcutsTerminal, { parseUser } from "../renderer/shortcutsTerminal.js";
import {
    caretToPos,
    clearHistory,
    close,
    getHistoryLength,
    getLines,
    getLockedLines,
    getSelection,
    getValue,
    lockLine,
    logHistory,
    maxHistoryLength,
    mockInput,
    open,
    redoHistory,
    removeLines,
    restore,
    setSelection,
    settleInput,
    state,
    undoHistory,
    unlockLine,
    writeLine,
    writeLines,
    writeText
} from "./index.js";

export default function testTerminal() {
    try {
        testTerminalBody();
        api.status('Terminal: Test done');
    } catch (error) {
        api.status('Terminal: Test fail', undefined, true);
        console.error(error);
    }
}

function testTerminalBody() {
    open();                                             /**/test('', [0, 0]);
    writeText('X\nY\nZ\nA');                            /**/test('X\nY\nZ\nA', [3, 1]);
    writeLine('N', 3);                                  /**/test('X\nY\nZ\nN', [3, 1]);
    // CUT

    // NOOP
    removeLines(3);                                     /**/test('X\nY\nZ', [2, 1]);
    writeLine('B', 0);                                  /**/test('B\nY\nZ', [0, 1]);
    writeLine('C', 1);                                  /**/test('B\nC\nZ', [1, 1]);
    writeLines({ 0: 'D', 1: 'E', 2: 'F', 3: 'G' });     /**/test('D\nE\nF\nG', [3, 1]);
    undoHistory();                                      /**/test('B\nC\nZ', [1, 1]);
    undoHistory();                                      /**/test('B\nY\nZ', [0, 1]);
    undoHistory();                                      /**/test('X\nY\nZ', [2, 1]);
    undoHistory();                                      /**/test('X\nY\nZ\nN', [3, 1]);

    writeLine('B');                                     /**/test('X\nY\nZ\nN\nB', [4, 1]);
    removeLines(1);                                     /**/test('X\nZ\nN\nB', [1, 0]);
    removeLines(2);                                     /**/test('X\nZ\nB', [2, 0]);

    // NOOP
    removeLines(0);                                     /**/test('Z\nB', [0, 0]);
    undoHistory();                                      /**/test('X\nZ\nB', [2, 0]);

    writeLine('T');                                     /**/test('X\nZ\nB\nT', [3, 1]);

    // NOOP
    writeLine('R');                                     /**/test('X\nZ\nB\nT\nR', [4, 1]);
    undoHistory();                                      /**/test('X\nZ\nB\nT', [3, 1]);

    removeLines(2);                                     /**/test('X\nZ\nT', [2, 0]);
    writeLine("A", 0);                                  /**/test('A\nZ\nT', [0, 1]);
    writeLine("B");                                     /**/test('A\nZ\nT\nB', [3, 1]);
    writeLine("C");                                     /**/test('A\nZ\nT\nB\nC', [4, 1]);
    removeLines(2);                                     /**/test('A\nZ\nB\nC', [2, 0]);
    writeLine("B", 1);                                  /**/test('A\nB\nB\nC', [1, 1]);
    writeLine("Q", 2);                                  /**/test('A\nB\nQ\nC', [2, 1]);
    setSelection([3, 0], [3, 1], 'backward');
    shortcut('Alt+ArrowUp');                            /**/test('A\nB\nC\nQ', [2, 0], [2, 1], 'backward');
    setSelection([2, 0], [2, 1]);
    shortcut('Alt+ArrowDown');                          /**/test('A\nB\nQ\nC', [3, 0], [3, 1]);

    // NOOP
    writeLines({ 0: 'C', 1: 'D', 2: 'E', 3: 'F' });     /**/test('C\nD\nE\nF', [3, 1]);
    undoHistory();                                      /**/test('A\nB\nQ\nC', [3, 0], [3, 1]);

    writeLines({ 0: 'X', 1: 'X', 2: 'X', 3: 'X' });     /**/test('X\nX\nX\nX', [3, 1]);
    writeLines({ 2: 'C', 1: 'D', 0: 'E' });             /**/test('E\nD\nC\nX', [2, 1]);
    writeLines({ 5: 'H', 7: 'J' });                     /**/test('E\nD\nC\nX\n\nH\n\nJ', [7, 1]);
    removeLines(4);                                     /**/test('E\nD\nC\nX\nH\n\nJ', [4, 0]);
    removeLines(6);                                     /**/test('E\nD\nC\nX\nH\n', [5, 0]);
    removeLines(0, 2);                                  /**/test('C\nX\nH\n', [0, 0]);
    removeLines(2, 4);                                  /**/test('C\nX', [1, 1]);

    // NOOP
    writeLines({ 0: 'C', 1: 'X' });                     /**/test('C\nX', [1, 1]);
    removeLines(-10, 10);                               /**/test('C\nX', [1, 1]);
    undoHistory();                                      /**/test('C\nX\nH\n', [0, 0]);
    redoHistory();                                      /**/test('C\nX', [1, 1]);

    writeLine('A');                                     /**/test('C\nX\nA', [2, 1]);
    writeLine('B');                                     /**/test('C\nX\nA\nB', [3, 1]);
    writeLine('C');                                     /**/test('C\nX\nA\nB\nC', [4, 1]);
    writeLine('D');                                     /**/test('C\nX\nA\nB\nC\nD', [5, 1]);
    removeLines(0, 2);                                  /**/test('A\nB\nC\nD', [0, 0]);
    writeLines({ 4: 'E', 5: 'F', 6: 'G', 7: 'H' });     /**/test('A\nB\nC\nD\nE\nF\nG\nH', [7, 1]);

    // NOOP
    writeText('A\nB\nC\nD\nE\nF\nG\nH');                /**/test('A\nB\nC\nD\nE\nF\nG\nH');

    writeText('H\nG\nF\nE\nD\nC\nB\nA');                /**/test('H\nG\nF\nE\nD\nC\nB\nA');

    writeText('  Username\n[ASD]  Username1\n[ASD] Username2  \n[ASD] UserName3   -   ...\n[ASD]    Username123\n[ASD] Username-Name  -    123\n  Username4\n   [ASD] UserName5  - 123');
    test('  Username\n[ASD]  Username1\n[ASD] Username2  \n[ASD] UserName3   -   ...\n[ASD]    Username123\n[ASD] Username-Name  -    123\n  Username4\n   [ASD] UserName5  - 123');

    shortcut('Alt+KeyC');
    test('Username\nUsername1\nUsername2\nUserName3\nUsername123\nUsername-Name\nUsername4\nUserName5');

    shortcut('Ctrl+ArrowUp');
    test('Username\nUsername-Name\nUsername1\nUsername123\nUsername2\nUserName3\nUsername4\nUserName5', /* [5, 9] */);

    shortcut('Ctrl+ArrowDown');
    test('UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername-Name\nUsername');

    shortcut('Alt+ArrowUp');
    test('UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername\nUsername-Name', [6, 8]);

    shortcut('Alt+ArrowDown');
    test('UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername-Name\nUsername');

    // NOOP
    shortcut('Alt+ArrowDown');
    test('UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername-Name\nUsername');
    setSelection([0, 0]);
    shortcut('Alt+ArrowUp');
    test('UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername-Name\nUsername', [0, 0]);

    setSelection([7, 8]);
    shortcut('Alt+ArrowUp');
    test('UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername\nUsername-Name', [6, 8]);

    writeText('User1\nUser2');                          /**/test('User1\nUser2');
    writeLine('Target', 0);                             /**/test('Target\nUser2', [0, 6]);

    // NOOP
    writeLine('Target...', 0, true);
    test2({
        text: 'Target...\nUser2',
        commited: 'Target\nUser2',
        start: [0, 9]
    });
    undoHistory();                                      /**/test('User1\nUser2');
    writeLine('User1...', 0, true);
    test2({
        text: 'User1...\nUser2',
        commited: 'User1\nUser2',
        start: [0, 8]
    });
    writeLine('User1', 0, true);
    test2({
        text: 'User1\nUser2',
        commited: 'User1\nUser2',
        start: [0, 5]
    });
    redoHistory();                                      /**/test('Target\nUser2', [0, 6]);

    writeText('Alpha\nBeta');                           /**/test('Alpha\nBeta');

    // NOOP
    writeLines(['Alpha...', 'Beta...'], true);
    test2({
        text: 'Alpha...\nBeta...',
        commited: 'Alpha\nBeta'
    });

    writeLine('Alpha - 100', 0);
    test2({
        text: 'Alpha - 100\nBeta...',
        commited: 'Alpha - 100\nBeta',
        start: [0, 11]
    });

    // NOOP
    undoHistory();
    test2({
        text: 'Alpha\nBeta...',
        commited: 'Alpha\nBeta',
        start: [1, 4]
    });
    redoHistory();
    test2({
        text: 'Alpha - 100\nBeta...',
        commited: 'Alpha - 100\nBeta',
        start: [0, 11]
    });

    // NOOP
    writeLine('Beta...', 1, true);
    test2({
        text: 'Alpha - 100\nBeta...',
        commited: 'Alpha - 100\nBeta',
    });
    assert(false, getLockedLines().has(1));
    lockLine(1);
    assert(true, getLockedLines().has(1));
    writeLine('Text', 1);
    test2({
        text: 'Alpha - 100\nBeta...',
        commited: 'Alpha - 100\nBeta',
    });
    unlockLine(1);
    assert(false, getLockedLines().has(1));
    restore();
    test('Alpha - 100\nBeta', [0, 11]);
    writeText('Alpha\nBeta\nCharlie', undefined, undefined, true);
    test('Alpha\nBeta\nCharlie', [0, 5]);

    restore();
    test('Alpha\nBeta\nCharlie', [2, 7]);

    removeLines(0, 3);
    test('');

    // NOOP
    undoHistory();
    test('Alpha\nBeta\nCharlie');
    redoHistory();

    restore();
    assert(maxHistoryLength - 1, state.historyIndex);
    const arr = [
        ['X\nY\nZ\nN'],
        ['X\nY\nZ\nN\nB', [4, 1]],
        ['X\nZ\nN\nB', [1, 0]],
        ['X\nZ\nB', [2, 0]],
        ['X\nZ\nB\nT', [3, 1]],
        ['X\nZ\nT', [2, 0]],
        ['A\nZ\nT', [0, 1]],
        ['A\nZ\nT\nB', [3, 1]],
        ['A\nZ\nT\nB\nC', [4, 1]],
        ['A\nZ\nB\nC', [2, 0]],
        ['A\nB\nB\nC', [1, 1]],
        ['A\nB\nQ\nC', [2, 1]],
        ['A\nB\nC\nQ', [2, 0], [2, 1], 'backward'],
        ['A\nB\nQ\nC', [3, 0], [3, 1]],
        ['X\nX\nX\nX', [3, 1]],
        ['E\nD\nC\nX', [2, 1]],
        ['E\nD\nC\nX\n\nH\n\nJ', [7, 1]],
        ['E\nD\nC\nX\nH\n\nJ', [4, 0]],
        ['E\nD\nC\nX\nH\n', [5, 0]],
        ['C\nX\nH\n', [0, 0]],
        ['C\nX', [1, 1]],
        ['C\nX\nA', [2, 1]],
        ['C\nX\nA\nB', [3, 1]],
        ['C\nX\nA\nB\nC', [4, 1]],
        ['C\nX\nA\nB\nC\nD', [5, 1]],
        ['A\nB\nC\nD', [0, 0]],
        ['A\nB\nC\nD\nE\nF\nG\nH', [7, 1]],
        ['H\nG\nF\nE\nD\nC\nB\nA'],
        ['  Username\n[ASD]  Username1\n[ASD] Username2  \n[ASD] UserName3   -   ...\n[ASD]    Username123\n[ASD] Username-Name  -    123\n  Username4\n   [ASD] UserName5  - 123'],
        ['Username\nUsername1\nUsername2\nUserName3\nUsername123\nUsername-Name\nUsername4\nUserName5'],
        ['Username\nUsername-Name\nUsername1\nUsername123\nUsername2\nUserName3\nUsername4\nUserName5', [5, 9]],
        ['UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername-Name\nUsername'],
        ['UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername\nUsername-Name', [6, 8]],
        ['UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername-Name\nUsername'],
        ['UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername\nUsername-Name', [6, 8]],
        ['User1\nUser2'],
        ['Target\nUser2', [0, 6]],
        ['Alpha\nBeta'],
        ['Alpha - 100\nBeta', [0, 11]],
        ['Alpha\nBeta\nCharlie', [2, 7]],
        [''],
    ];
    assert(arr.length, maxHistoryLength + 1);
    testHistory(...arr);

    writeText('Username');
    clearHistory();
    testHistory(['Username']);
    writeText('Username');
    testHistory(['Username']);

    writeLine('Username - ...', 0, true, true);
    lockLine(0, () => {
        unlockLine(0);
        writeLine('Username', 0, true, true)
    });
    mockInput('User - ...', { start: [0, 5] });
    testHistory(['Username']);

    writeText('Alpha\nBeta - 123\nCharlie');
    clearHistory();
    writeLine('Charlie - ...', 2, true, true);
    lockLine(2, () => {
        unlockLine(2);
        writeLine('Charlie', 2, true, true)
    });
    mockInput('Charli - ...', { start: [0, 6] });
    testHistory(['Alpha\nBeta - 123\nCharlie']);

    writeText('ABC'); clearHistory(); restore();
    writeText('ABC 123', undefined, true);

    undoHistory();
    test('ABC');

    writeText('ABC 123', undefined, true);
    redoHistory();
    test('ABC');

    mockInput('ABC 123', undefined, () => undoHistory());
    testHistory(['ABC']);

    mockInput('ABC 123', undefined, () => redoHistory());
    testHistory(['ABC'], ['ABC 123']);

    clearHistory();
    writeLine('A', 0);
    writeLine('B', 1);
    writeLine('C', 2);
    writeLine('D', 1);
    mockInput('Q\nW\nE\nR\nT\nY', undefined, () => undoHistory());
    test('A\nD\nC', [1, 1]);

    writeText('Alpha');
    clearHistory();
    test('Alpha');
    writeLine('Alpha - ...', 0, true, true);
    test2({ text: 'Alpha - ...', commited: 'Alpha', start: [0, 5] });
    lockLine(0, () => {
        unlockLine(0);
        writeLine('Alpha', 0, true, true);
    });
    mockInput('Alpha - ...\nBeta', undefined, false);
    assert(state.inputLoading, true);
    test2({ text: 'Alpha - ...\nBeta', commited: 'Alpha' });
    writeLine('Alpha - 123', 0, undefined, true, true);
    unlockLine(0);
    assert(state.inputLoading, false);
    test('Alpha - 123\nBeta');
    testHistory(['Alpha'], ['Alpha\nBeta'], ['Alpha - 123\nBeta', [0, 11]]);

    restore(); writeText(''); clearHistory(); logHistory(); close();

    const testParseUser = (input, expected) => assert(expected, Object.values(parseUser(input)));
    [
        ["Username",               /**/[null,       /**/"Username",    /**/null]],
        ["Username",               /**/[null,       /**/"Username",    /**/null]],
        ["Username-100",           /**/[null,       /**/"Username-100",/**/null]],
        ["Username- 100",          /**/['Username-',/**/"100",         /**/null]],
        ["Username ",              /**/[null,       /**/"Username",    /**/null]],
        ["Username -100",          /**/['Username', /**/"-100",        /**/null]],
        ["Username -",             /**/[null,       /**/"Username",    /**/null]],
        ["Username - 100",         /**/[null,       /**/"Username",    /**/"100"]],
        ["Username - ",            /**/[null,       /**/"Username",    /**/null]],
        ["Clan Username",          /**/['Clan',     /**/"Username",    /**/null]],
        ["Clan Username - 100",    /**/['Clan',     /**/"Username",    /**/"100"]],
        ["Clan Mid Username - 100",/**/['Clan',     /**/"MidUsername", /**/"100"]],
        ["100",                    /**/[null,       /**/"100",         /**/null]],
        ["-Username",              /**/[null,       /**/"-Username",   /**/null]],
        ["- 100",                  /**/[null,       /**/null,          /**/'100']],
        [" - 100",                 /**/[null,       /**/null,          /**/'100']],
    ].forEach(args => testParseUser(...args));
}

function shortcut(targetInput) {
    shortcutsTerminal.forEach(([input, , f]) => {
        if (input === targetInput) f();
    });
}

export function assert(expected, actual, name) {
    expected = JSON.stringify(expected);
    actual = JSON.stringify(actual);
    if (expected === actual) return;
    const message = `Expected: ${expected} Actual: ${actual}`;
    throw new Error(name ? `${name}: ${message}` : message);
}

function test(text, start, end, dir, name) {
    return test2({ text, start, end, dir, name });
}

function test2({
    text,
    commited = text,
    start = caretToPos(getLines(text), Infinity),
    end = start,
    dir = 'forward',
    name = text
}) {
    const _ = ([s]) => `${JSON.stringify(name)}.${s}`;

    assert(text, getValue(), _`text`);
    assert(commited, getValue(true), _`commited`);

    const sel = getSelection();
    assert(start, sel.start, _`start`);
    assert(end, sel.end, _`end`);
    assert(dir, sel.dir, _`dir`);
}

function testHistory(...arr) {
    const validLength = getHistoryLength() + 1;
    assert(validLength, arr.length, 'history');

    const initIndex = state.historyIndex;
    settleInput();

    for (let i = state.historyIndex; i < arr.length - 1; i++)
        _(i, redoHistory, 'redo');

    for (let i = state.historyIndex; i >= -1; i--)
        _(i, undoHistory, 'undo');

    for (let i = state.historyIndex; i < initIndex; i++)
        _(i, redoHistory, 'redo');

    function _(i, f, s) {
        assert(i, state.historyIndex, s);
        test(...arr[i + 1]);
        f();
    }
}
