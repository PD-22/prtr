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
    writeTerminalLines
} from "./terminal.js";

export default function testTerminal() {
    openTerminal();                                             /**/test('', 0);
    writeTerminalText('X\nY\nZ\nA');                            /**/test('X\nY\nZ\nA', 7);
    writeTerminalLine('N', 3);                                  /**/test('X\nY\nZ\nN', 7);
    // CUT

    // NOOP
    removeTerminalLines(3);                                     /**/test('X\nY\nZ', 5);
    writeTerminalLine('B', 0);                                  /**/test('B\nY\nZ', 1);
    writeTerminalLine('C', 1);                                  /**/test('B\nC\nZ', 3);
    writeTerminalLines({ 0: 'D', 1: 'E', 2: 'F', 3: 'G' });     /**/test('D\nE\nF\nG', 7);
    undoTerminalHistory();                                      /**/test('B\nC\nZ', 3);
    undoTerminalHistory();                                      /**/test('B\nY\nZ', 1);
    undoTerminalHistory();                                      /**/test('X\nY\nZ', 5);
    undoTerminalHistory();                                      /**/test('X\nY\nZ\nN', 7);

    writeTerminalLine('B');                                     /**/test('X\nY\nZ\nN\nB', 9);
    removeTerminalLines(1);                                     /**/test('X\nZ\nN\nB', 2);
    removeTerminalLines(2);                                     /**/test('X\nZ\nB', 4);

    // NOOP
    removeTerminalLines(0);                                     /**/test('Z\nB', 0);
    undoTerminalHistory();                                      /**/test('X\nZ\nB', 4);

    writeTerminalLine('T');                                     /**/test('X\nZ\nB\nT', 7);

    // NOOP
    writeTerminalLine('R');                                     /**/test('X\nZ\nB\nT\nR', 9);
    undoTerminalHistory();                                      /**/test('X\nZ\nB\nT', 7);

    removeTerminalLines(2);                                     /**/test('X\nZ\nT', 4);
    writeTerminalLine("A", 0);                                  /**/test('A\nZ\nT', 1);
    writeTerminalLine("B");                                     /**/test('A\nZ\nT\nB', 7);
    writeTerminalLine("C");                                     /**/test('A\nZ\nT\nB\nC', 9);
    removeTerminalLines(2);                                     /**/test('A\nZ\nB\nC', 4);
    writeTerminalLine("B", 1);                                  /**/test('A\nB\nB\nC', 3);
    writeTerminalLine("Q", 2);                                  /**/test('A\nB\nQ\nC', 5);
    setTerminalSelection(6, 7, 'backward'); shortcut('Up');     /**/test('A\nB\nC\nQ', 4, 5, 'backward');
    setTerminalSelection(4, 5); shortcut('Down');               /**/test('A\nB\nQ\nC', 6, 7);

    // NOOP
    writeTerminalLines({ 0: 'C', 1: 'D', 2: 'E', 3: 'F' });     /**/test('C\nD\nE\nF', 7);
    undoTerminalHistory();                                      /**/test('A\nB\nQ\nC', 6, 7);

    writeTerminalLines({ 0: 'X', 1: 'X', 2: 'X', 3: 'X' });     /**/test('X\nX\nX\nX', 7);
    writeTerminalLines({ 2: 'C', 1: 'D', 0: 'E' });             /**/test('E\nD\nC\nX', 5);
    writeTerminalLines({ 5: 'H', 7: 'J' });                     /**/test('E\nD\nC\nX\n\nH\n\nJ', 13);
    removeTerminalLines(4);                                     /**/test('E\nD\nC\nX\nH\n\nJ', 8);
    removeTerminalLines(6);                                     /**/test('E\nD\nC\nX\nH\n', 10);
    removeTerminalLines(0, 2);                                  /**/test('C\nX\nH\n', 0);
    removeTerminalLines(2, 4);                                  /**/test('C\nX', 3);

    // NOOP
    writeTerminalLines({ 0: 'C', 1: 'X' });                     /**/test('C\nX', 3);
    removeTerminalLines(-10, 10);                               /**/test('C\nX', 3);
    undoTerminalHistory();                                      /**/test('C\nX\nH\n', 0);
    redoTerminalHistory();                                      /**/test('C\nX', 3);

    writeTerminalLine('A');                                     /**/test('C\nX\nA', 5);
    writeTerminalLine('B');                                     /**/test('C\nX\nA\nB', 7);
    writeTerminalLine('C');                                     /**/test('C\nX\nA\nB\nC', 9);
    writeTerminalLine('D');                                     /**/test('C\nX\nA\nB\nC\nD', 11);
    removeTerminalLines(0, 2);                                  /**/test('A\nB\nC\nD', 0);
    writeTerminalLines({ 4: 'E', 5: 'F', 6: 'G', 7: 'H' });     /**/test('A\nB\nC\nD\nE\nF\nG\nH', 15);

    // NOOP
    writeTerminalText('A\nB\nC\nD\nE\nF\nG\nH');                /**/test('A\nB\nC\nD\nE\nF\nG\nH', 15);

    writeTerminalText('H\nG\nF\nE\nD\nC\nB\nA');                /**/test('H\nG\nF\nE\nD\nC\nB\nA', 15);

    writeTerminalText('  Username\n[ASD]  Username1\n[ASD] Username2  \n[ASD] UserName3   -   ...\n[ASD]    Username123\n[ASD] Username-Name  -    123\n  Username4\n   [ASD] UserName5  - 123');
    test('  Username\n[ASD]  Username1\n[ASD] Username2  \n[ASD] UserName3   -   ...\n[ASD]    Username123\n[ASD] Username-Name  -    123\n  Username4\n   [ASD] UserName5  - 123');

    shortcut('Clean');
    test('Username\nUsername1\nUsername2\nUserName3 - ...\nUsername123\nUsername-Name - 123\nUsername4\nUserName5 - 123');

    shortcut('Clear');
    test('Username\nUsername1\nUsername2\nUserName3\nUsername123\nUsername-Name\nUsername4\nUserName5');

    shortcut('Ascending');
    test('Username\nUsername-Name\nUsername1\nUsername123\nUsername2\nUserName3\nUsername4\nUserName5', 64);

    shortcut('Descending');
    test('UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername-Name\nUsername');

    shortcut('Up');
    test('UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername\nUsername-Name', 70);

    shortcut('Down');
    test('UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername-Name\nUsername');

    // NOOP
    shortcut('Down');
    test('UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername-Name\nUsername');
    setTerminalSelection(0);
    shortcut('Up');
    test('UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername-Name\nUsername', 0);

    setTerminalSelection('UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername-Name\nUsername'.length);
    shortcut('Up');
    test('UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername\nUsername-Name', 70);

    writeTerminalText('User1\nUser2');                          /**/test('User1\nUser2');
    writeTerminalLine('Target', 0);                             /**/test('Target\nUser2', 6);

    // NOOP
    writeTerminalLine('Target...', 0, true);
    test2({
        text: 'Target...\nUser2',
        commited: 'Target\nUser2',
        start: 9
    });
    undoTerminalHistory();                                      /**/test('User1\nUser2');
    writeTerminalLine('User1...', 0, true);
    test2({
        text: 'User1...\nUser2',
        commited: 'User1\nUser2',
        start: 8
    });
    writeTerminalLine('User1', 0, true);
    test2({
        text: 'User1\nUser2',
        commited: 'User1\nUser2',
        start: 5
    });

    redoTerminalHistory();                                      /**/test('Target\nUser2', 6);

    testUndoRedo(
        // ['X\nY\nZ\nA', 7],
        // ['X\nY\nZ\nN', 7],
        ['X\nY\nZ\nN\nB', 9],
        ['X\nZ\nN\nB', 2],
        ['X\nZ\nB', 4],
        ['X\nZ\nB\nT', 7],
        ['X\nZ\nT', 4],
        ['A\nZ\nT', 1],
        ['A\nZ\nT\nB', 7],
        ['A\nZ\nT\nB\nC', 9],
        ['A\nZ\nB\nC', 4],
        ['A\nB\nB\nC', 3],
        ['A\nB\nQ\nC', 5],
        ['A\nB\nC\nQ', 4, 5, 'backward'],
        ['A\nB\nQ\nC', 6, 7],
        ['X\nX\nX\nX', 7],
        ['E\nD\nC\nX', 5],
        ['E\nD\nC\nX\n\nH\n\nJ', 13],
        ['E\nD\nC\nX\nH\n\nJ', 8],
        ['E\nD\nC\nX\nH\n', 10],
        ['C\nX\nH\n', 0],
        ['C\nX', 3],
        ['C\nX\nA', 5],
        ['C\nX\nA\nB', 7],
        ['C\nX\nA\nB\nC', 9],
        ['C\nX\nA\nB\nC\nD', 11],
        ['A\nB\nC\nD', 0],
        ['A\nB\nC\nD\nE\nF\nG\nH', 15],
        ['H\nG\nF\nE\nD\nC\nB\nA', 15],
        ['  Username\n[ASD]  Username1\n[ASD] Username2  \n[ASD] UserName3   -   ...\n[ASD]    Username123\n[ASD] Username-Name  -    123\n  Username4\n   [ASD] UserName5  - 123'],
        ['Username\nUsername1\nUsername2\nUserName3 - ...\nUsername123\nUsername-Name - 123\nUsername4\nUserName5 - 123'],
        ['Username\nUsername1\nUsername2\nUserName3\nUsername123\nUsername-Name\nUsername4\nUserName5'],
        ['Username\nUsername-Name\nUsername1\nUsername123\nUsername2\nUserName3\nUsername4\nUserName5', 64],
        ['UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername-Name\nUsername'],
        ['UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername\nUsername-Name', 70],
        ['UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername-Name\nUsername'],
        ['UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername\nUsername-Name', 70],
        ['User1\nUser2'],
        ['Target\nUser2', 6]
    );
}

function shortcut(name) {
    shortcutsTerminal.find(x => x[1] === name)[2]();
}

export function assert(expected, actual) {
    if (expected === actual) return;
    expected = JSON.stringify(expected);
    actual = JSON.stringify(actual);
    throw new Error(`Expected: ${expected} Actual: ${actual}`);
}

function test(text, start, end, dir) {
    return test2({ text, start, end, dir });
}

function test2(options) {
    let { text, commited, start, end, dir } = options;
    commited ??= text;
    start ??= text.length;
    end ??= start;
    dir ??= 'forward';

    assert(text, getTerminalValue());
    assert(commited, getTerminalValue(false));
    if (start === false) return;

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
        test(calculateTerminalLines(i).join('\n'), false);
    }

    indexList.reverse();
    indexList.slice(1).forEach(i => { undoTerminalHistory(); f(i); });

    indexList.reverse();
    indexList.slice(1).forEach(i => { redoTerminalHistory(); f(i); });
}
