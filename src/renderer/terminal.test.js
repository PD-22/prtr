import shortcutsTerminal from "./shortcutsTerminal.js";
import {
    calculateTerminalLines,
    getTerminalSelection,
    getTerminalValue,
    historyIndex,
    maxHistoryLength,
    openTerminal,
    redoTerminalHistory,
    removeTerminalLines,
    setTerminalSelection,
    undoTerminalHistory,
    writeTerminalText,
    writeTerminalLine,
    writeTerminalLines,
    getTerminalLines,
    restoreTerminalValue,
    lockTerminalLine,
    getLockedTerminalLines,
    unlockTerminalLine
} from "./terminal.js";

export default function testTerminal() {
    openTerminal();                                             /**/test('', [0, 0]);
    writeTerminalText('X\nY\nZ\nA');                            /**/test('X\nY\nZ\nA', [3, 1]);
    writeTerminalLine('N', 3);                                  /**/test('X\nY\nZ\nN', [3, 1]);
    // CUT

    // NOOP
    removeTerminalLines(3);                                     /**/test('X\nY\nZ', [2, 1]);
    writeTerminalLine('B', 0);                                  /**/test('B\nY\nZ', [0, 1]);
    writeTerminalLine('C', 1);                                  /**/test('B\nC\nZ', [1, 1]);
    writeTerminalLines({ 0: 'D', 1: 'E', 2: 'F', 3: 'G' });     /**/test('D\nE\nF\nG', [3, 1]);
    undoTerminalHistory();                                      /**/test('B\nC\nZ', [1, 1]);
    undoTerminalHistory();                                      /**/test('B\nY\nZ', [0, 1]);
    undoTerminalHistory();                                      /**/test('X\nY\nZ', [2, 1]);
    undoTerminalHistory();                                      /**/test('X\nY\nZ\nN', [3, 1]);

    writeTerminalLine('B');                                     /**/test('X\nY\nZ\nN\nB', [4, 1]);
    removeTerminalLines(1);                                     /**/test('X\nZ\nN\nB', [1, 0]);
    removeTerminalLines(2);                                     /**/test('X\nZ\nB', [2, 0]);

    // NOOP
    removeTerminalLines(0);                                     /**/test('Z\nB', [0, 0]);
    undoTerminalHistory();                                      /**/test('X\nZ\nB', [2, 0]);

    writeTerminalLine('T');                                     /**/test('X\nZ\nB\nT', [3, 1]);

    // NOOP
    writeTerminalLine('R');                                     /**/test('X\nZ\nB\nT\nR', [4, 1]);
    undoTerminalHistory();                                      /**/test('X\nZ\nB\nT', [3, 1]);

    removeTerminalLines(2);                                     /**/test('X\nZ\nT', [2, 0]);
    writeTerminalLine("A", 0);                                  /**/test('A\nZ\nT', [0, 1]);
    writeTerminalLine("B");                                     /**/test('A\nZ\nT\nB', [3, 1]);
    writeTerminalLine("C");                                     /**/test('A\nZ\nT\nB\nC', [4, 1]);
    removeTerminalLines(2);                                     /**/test('A\nZ\nB\nC', [2, 0]);
    writeTerminalLine("B", 1);                                  /**/test('A\nB\nB\nC', [1, 1]);
    writeTerminalLine("Q", 2);                                  /**/test('A\nB\nQ\nC', [2, 1]);
    setTerminalSelection([3, 0], [3, 1], 'backward');
    shortcut('Up');                                             /**/test('A\nB\nC\nQ', [2, 0], [2, 1], 'backward');
    setTerminalSelection([2, 0], [2, 1]); shortcut('Down');     /**/test('A\nB\nQ\nC', [3, 0], [3, 1]);

    // NOOP
    writeTerminalLines({ 0: 'C', 1: 'D', 2: 'E', 3: 'F' });     /**/test('C\nD\nE\nF', [3, 1]);
    undoTerminalHistory();                                      /**/test('A\nB\nQ\nC', [3, 0], [3, 1]);

    writeTerminalLines({ 0: 'X', 1: 'X', 2: 'X', 3: 'X' });     /**/test('X\nX\nX\nX', [3, 1]);
    writeTerminalLines({ 2: 'C', 1: 'D', 0: 'E' });             /**/test('E\nD\nC\nX', [2, 1]);
    writeTerminalLines({ 5: 'H', 7: 'J' });                     /**/test('E\nD\nC\nX\n\nH\n\nJ', [7, 1]);
    removeTerminalLines(4);                                     /**/test('E\nD\nC\nX\nH\n\nJ', [4, 0]);
    removeTerminalLines(6);                                     /**/test('E\nD\nC\nX\nH\n', [5, 0]);
    removeTerminalLines(0, 2);                                  /**/test('C\nX\nH\n', [0, 0]);
    removeTerminalLines(2, 4);                                  /**/test('C\nX', [1, 1]);

    // NOOP
    writeTerminalLines({ 0: 'C', 1: 'X' });                     /**/test('C\nX', [1, 1]);
    removeTerminalLines(-10, 10);                               /**/test('C\nX', [1, 1]);
    undoTerminalHistory();                                      /**/test('C\nX\nH\n', [0, 0]);
    redoTerminalHistory();                                      /**/test('C\nX', [1, 1]);

    writeTerminalLine('A');                                     /**/test('C\nX\nA', [2, 1]);
    writeTerminalLine('B');                                     /**/test('C\nX\nA\nB', [3, 1]);
    writeTerminalLine('C');                                     /**/test('C\nX\nA\nB\nC', [4, 1]);
    writeTerminalLine('D');                                     /**/test('C\nX\nA\nB\nC\nD', [5, 1]);
    removeTerminalLines(0, 2);                                  /**/test('A\nB\nC\nD', [0, 0]);
    writeTerminalLines({ 4: 'E', 5: 'F', 6: 'G', 7: 'H' });     /**/test('A\nB\nC\nD\nE\nF\nG\nH', [7, 1]);

    // NOOP
    writeTerminalText('A\nB\nC\nD\nE\nF\nG\nH');                /**/test('A\nB\nC\nD\nE\nF\nG\nH');

    writeTerminalText('H\nG\nF\nE\nD\nC\nB\nA');                /**/test('H\nG\nF\nE\nD\nC\nB\nA');

    writeTerminalText('  Username\n[ASD]  Username1\n[ASD] Username2  \n[ASD] UserName3   -   ...\n[ASD]    Username123\n[ASD] Username-Name  -    123\n  Username4\n   [ASD] UserName5  - 123');
    test('  Username\n[ASD]  Username1\n[ASD] Username2  \n[ASD] UserName3   -   ...\n[ASD]    Username123\n[ASD] Username-Name  -    123\n  Username4\n   [ASD] UserName5  - 123');

    shortcut('Clean');
    test('Username\nUsername1\nUsername2\nUserName3 - ...\nUsername123\nUsername-Name - 123\nUsername4\nUserName5 - 123');

    shortcut('Clear');
    test('Username\nUsername1\nUsername2\nUserName3\nUsername123\nUsername-Name\nUsername4\nUserName5');

    shortcut('Ascending');
    test('Username\nUsername-Name\nUsername1\nUsername123\nUsername2\nUserName3\nUsername4\nUserName5', [5, 9]);

    shortcut('Descending');
    test('UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername-Name\nUsername');

    shortcut('Up');
    test('UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername\nUsername-Name', [6, 8]);

    shortcut('Down');
    test('UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername-Name\nUsername');

    // NOOP
    shortcut('Down');
    test('UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername-Name\nUsername');
    setTerminalSelection([0, 0]);
    shortcut('Up');
    test('UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername-Name\nUsername', [0, 0]);

    setTerminalSelection([7, 8]);
    shortcut('Up');
    test('UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername\nUsername-Name', [6, 8]);

    writeTerminalText('User1\nUser2');                          /**/test('User1\nUser2');
    writeTerminalLine('Target', 0);                             /**/test('Target\nUser2', [0, 6]);

    // NOOP
    writeTerminalLine('Target...', 0, true);
    test2({
        text: 'Target...\nUser2',
        commited: 'Target\nUser2',
        start: [0, 9]
    });
    undoTerminalHistory();                                      /**/test('User1\nUser2');
    writeTerminalLine('User1...', 0, true);
    test2({
        text: 'User1...\nUser2',
        commited: 'User1\nUser2',
        start: [0, 8]
    });
    writeTerminalLine('User1', 0, true);
    test2({
        text: 'User1\nUser2',
        commited: 'User1\nUser2',
        start: [0, 5]
    });
    redoTerminalHistory();                                      /**/test('Target\nUser2', [0, 6]);

    writeTerminalText('Alpha\nBeta');                           /**/test('Alpha\nBeta');

    // NOOP
    writeTerminalLines(['Alpha...', 'Beta...'], true);
    test2({
        text: 'Alpha...\nBeta...',
        commited: 'Alpha\nBeta'
    });

    writeTerminalLine('Alpha - 100', 0);
    test2({
        text: 'Alpha - 100\nBeta...',
        commited: 'Alpha - 100\nBeta',
        start: [0, 11]
    });

    // NOOP
    undoTerminalHistory();
    test2({
        text: 'Alpha\nBeta...',
        commited: 'Alpha\nBeta',
        start: [1, 4]
    });
    redoTerminalHistory();
    test2({
        text: 'Alpha - 100\nBeta...',
        commited: 'Alpha - 100\nBeta',
        start: [0, 11]
    });

    restoreTerminalValue();
    testUndoRedo(
        // ['X\nY\nZ\nA', 7],
        // ['X\nY\nZ\nN', 7],
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
        ['Username\nUsername1\nUsername2\nUserName3 - ...\nUsername123\nUsername-Name - 123\nUsername4\nUserName5 - 123'],
        ['Username\nUsername1\nUsername2\nUserName3\nUsername123\nUsername-Name\nUsername4\nUserName5'],
        ['Username\nUsername-Name\nUsername1\nUsername123\nUsername2\nUserName3\nUsername4\nUserName5', [5, 9]],
        ['UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername-Name\nUsername'],
        ['UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername\nUsername-Name', [6, 8]],
        ['UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername-Name\nUsername'],
        ['UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername\nUsername-Name', [6, 8]],
        ['User1\nUser2'],
        ['Target\nUser2', [0, 6]],
        ['Alpha\nBeta'],
        ['Alpha - 100\nBeta', [0, 11]]
    );

    writeTerminalLine('Beta...', 1, true);
    test2({
        text: 'Alpha - 100\nBeta...',
        commited: 'Alpha - 100\nBeta',
    });
    assert(false, getLockedTerminalLines().has(1));
    lockTerminalLine(1);
    assert(true, getLockedTerminalLines().has(1));
    writeTerminalLine('Text', 1);
    test2({
        text: 'Alpha - 100\nBeta...',
        commited: 'Alpha - 100\nBeta',
    });
    unlockTerminalLine(1);
    assert(false, getLockedTerminalLines().has(1));

    window.electron.status('Terminal: TEST: DONE');
}

function shortcut(name) {
    shortcutsTerminal.find(x => x[1] === name)[2]();
}

export function assert(expected, actual) {
    expected = JSON.stringify(expected);
    actual = JSON.stringify(actual);
    if (expected === actual) return;
    throw new Error(`Expected: ${expected} Actual: ${actual}`);
}

function test(text, start, end, dir) {
    return test2({ text, start, end, dir });
}

function test2(options) {
    let { text, commited, start, end, dir } = options;
    commited ??= text;
    const lines = getTerminalLines(text);
    const lastIndex = lines.length - 1;
    start ??= [lastIndex, lines[lastIndex].length];
    end ??= start;
    dir ??= 'forward';

    assert(text, getTerminalValue());
    assert(commited, getTerminalValue(true));

    const sel = getTerminalSelection();
    assert(start, sel.start);
    assert(end, sel.end);
    assert(dir, sel.dir);
}

function testUndoRedo(...arr) {
    assert(arr.length, maxHistoryLength);
    assert(maxHistoryLength, historyIndex);
    const indexList = arr.map((_v, i) => i);

    const f = i => {
        assert(i, historyIndex - 1);
        const [text, start, end, dir] = arr[i];
        test(text, start, end, dir);
    }

    indexList.reverse();
    indexList.slice(1).forEach(i => { undoTerminalHistory(); f(i); });

    indexList.reverse();
    indexList.slice(1).forEach(i => { redoTerminalHistory(); f(i); });
}
