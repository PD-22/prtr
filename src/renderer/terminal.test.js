import shortcutsTerminal from "./shortcutsTerminal.js";
import {
    calculateTerminalLines,
    getTerminalValue,
    historyIndex,
    maxHistoryLength,
    openTerminal,
    redoTerminalHistory,
    removeTerminalLines,
    setTerminalSelection,
    undoTerminalHistory,
    writeTerminal,
    writeTerminalLine,
    writeTerminalLines
} from "./terminal.js";

export default function testTerminal() {
    openTerminal();                                             /**/test('');
    writeTerminal('X\nY\nZ\nA');                                /**/test('X\nY\nZ\nA');
    writeTerminalLine('N', 3);                                  /**/test('X\nY\nZ\nN');

    // NOOP
    removeTerminalLines(3);                                     /**/test('X\nY\nZ');
    writeTerminalLine('B', 0);                                  /**/test('B\nY\nZ');
    writeTerminalLine('C', 1);                                  /**/test('B\nC\nZ');
    writeTerminalLines({ 0: 'D', 1: 'E', 2: 'F', 3: 'G' });     /**/test('D\nE\nF\nG');
    undoTerminalHistory();                                      /**/test('B\nC\nZ');
    undoTerminalHistory();                                      /**/test('B\nY\nZ');
    undoTerminalHistory();                                      /**/test('X\nY\nZ');
    undoTerminalHistory();                                      /**/test('X\nY\nZ\nN');

    writeTerminalLine('B');                                     /**/test('X\nY\nZ\nN\nB');
    removeTerminalLines(1);                                     /**/test('X\nZ\nN\nB');
    removeTerminalLines(2);                                     /**/test('X\nZ\nB');

    // NOOP
    removeTerminalLines(0);                                     /**/test('Z\nB');
    undoTerminalHistory();                                      /**/test('X\nZ\nB');

    writeTerminalLine('T');                                     /**/test('X\nZ\nB\nT');

    // NOOP
    writeTerminalLine('R');                                     /**/test('X\nZ\nB\nT\nR');
    undoTerminalHistory();                                      /**/test('X\nZ\nB\nT');

    removeTerminalLines(2);                                     /**/test('X\nZ\nT');
    writeTerminalLine("A", 0);                                  /**/test('A\nZ\nT');
    writeTerminalLine("B");                                     /**/test('A\nZ\nT\nB');
    writeTerminalLine("C");                                     /**/test('A\nZ\nT\nB\nC');
    removeTerminalLines(2);                                     /**/test('A\nZ\nB\nC');
    writeTerminalLine("B", 1);                                  /**/test('A\nB\nB\nC');
    writeTerminalLine("Q", 2);                                  /**/test('A\nB\nQ\nC');

    // NOOP
    writeTerminalLines({ 0: 'C', 1: 'D', 2: 'E', 3: 'F' });     /**/test('C\nD\nE\nF');
    undoTerminalHistory();                                      /**/test('A\nB\nQ\nC');

    writeTerminalLines({ 0: 'X', 1: 'X', 2: 'X', 3: 'X' });     /**/test('X\nX\nX\nX');
    writeTerminalLines({ 2: 'C', 1: 'D', 0: 'E' });             /**/test('E\nD\nC\nX');
    writeTerminalLines({ 5: 'H', 7: 'J' });                     /**/test('E\nD\nC\nX\n\nH\n\nJ');
    removeTerminalLines(4);                                     /**/test('E\nD\nC\nX\nH\n\nJ');
    removeTerminalLines(6);                                     /**/test('E\nD\nC\nX\nH\n');
    removeTerminalLines(0, 2);                                  /**/test('C\nX\nH\n');
    removeTerminalLines(-2, 2);                                 /**/test('C\nX');
    writeTerminalLines({ 0: 'C', 1: 'X' });                     /**/test('C\nX');

    // NOOP
    undoTerminalHistory();                                      /**/test('C\nX\nH\n');
    redoTerminalHistory();                                      /**/test('C\nX');

    writeTerminalLine('A');                                     /**/test('C\nX\nA');
    writeTerminalLine('B');                                     /**/test('C\nX\nA\nB');
    writeTerminalLine('C');                                     /**/test('C\nX\nA\nB\nC');
    writeTerminalLine('D');                                     /**/test('C\nX\nA\nB\nC\nD');
    removeTerminalLines(0, 2);                                  /**/test('A\nB\nC\nD');
    writeTerminalLines({ 4: 'E', 5: 'F', 6: 'G', 7: 'H' });     /**/test('A\nB\nC\nD\nE\nF\nG\nH');
    writeTerminal('A\nB\nC\nD\nE\nF\nG\nH');                    /**/test('A\nB\nC\nD\nE\nF\nG\nH');
    writeTerminal('H\nG\nF\nE\nD\nC\nB\nA');                    /**/test('H\nG\nF\nE\nD\nC\nB\nA');

    writeTerminal('  Username\n[ASD]  Username1\n[ASD] Username2  \n[ASD] UserName3   -   ...\n[ASD]    Username123\n[ASD] Username-Name  -    123\n  Username4\n   [ASD] UserName5  - 123');
    test('  Username\n[ASD]  Username1\n[ASD] Username2  \n[ASD] UserName3   -   ...\n[ASD]    Username123\n[ASD] Username-Name  -    123\n  Username4\n   [ASD] UserName5  - 123');

    shortcut('Clean');
    test('Username\nUsername1\nUsername2\nUserName3 - ...\nUsername123\nUsername-Name - 123\nUsername4\nUserName5 - 123');

    shortcut('Clear');
    test('Username\nUsername1\nUsername2\nUserName3\nUsername123\nUsername-Name\nUsername4\nUserName5');

    shortcut('Ascending');
    test('Username\nUsername-Name\nUsername1\nUsername123\nUsername2\nUserName3\nUsername4\nUserName5');

    shortcut('Descending');
    test('UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername-Name\nUsername');

    setTerminalSelection(getTerminalValue().length); shortcut('Up');
    test('UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername\nUsername-Name');

    // NOOP
    setTerminalSelection(getTerminalValue().length); shortcut('Down');
    test('UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername\nUsername-Name');

    setTerminalSelection(0, 0); shortcut('Down');
    test('Username4\nUserName5\nUserName3\nUsername2\nUsername123\nUsername1\nUsername\nUsername-Name');

    // NOOP
    setTerminalSelection(0, 0); shortcut('Up');
    test('Username4\nUserName5\nUserName3\nUsername2\nUsername123\nUsername1\nUsername\nUsername-Name');

    writeTerminal('');
    test('');

    testUndoRedo(
        'X\nY\nZ\nN\nB',
        'X\nZ\nN\nB',
        'X\nZ\nB',
        'X\nZ\nB\nT',
        'X\nZ\nT',
        'A\nZ\nT',
        'A\nZ\nT\nB',
        'A\nZ\nT\nB\nC',
        'A\nZ\nB\nC',
        'A\nB\nB\nC',
        'A\nB\nQ\nC',
        'X\nX\nX\nX',
        'E\nD\nC\nX',
        'E\nD\nC\nX\n\nH\n\nJ',
        'E\nD\nC\nX\nH\n\nJ',
        'E\nD\nC\nX\nH\n',
        'C\nX\nH\n',
        'C\nX',
        'C\nX\nA',
        'C\nX\nA\nB',
        'C\nX\nA\nB\nC',
        'C\nX\nA\nB\nC\nD',
        'A\nB\nC\nD',
        'A\nB\nC\nD\nE\nF\nG\nH',
        'H\nG\nF\nE\nD\nC\nB\nA',
        '  Username\n[ASD]  Username1\n[ASD] Username2  \n[ASD] UserName3   -   ...\n[ASD]    Username123\n[ASD] Username-Name  -    123\n  Username4\n   [ASD] UserName5  - 123',
        'Username\nUsername1\nUsername2\nUserName3 - ...\nUsername123\nUsername-Name - 123\nUsername4\nUserName5 - 123',
        'Username\nUsername1\nUsername2\nUserName3\nUsername123\nUsername-Name\nUsername4\nUserName5',
        'Username\nUsername-Name\nUsername1\nUsername123\nUsername2\nUserName3\nUsername4\nUserName5',
        'UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername-Name\nUsername',
        'UserName5\nUsername4\nUserName3\nUsername2\nUsername123\nUsername1\nUsername\nUsername-Name',
        'Username4\nUserName5\nUserName3\nUsername2\nUsername123\nUsername1\nUsername\nUsername-Name',
        '',
    );
}

function shortcut(name) {
    shortcutsTerminal.find(x => x[1] === name)[2]();
}

function assert(expected, actual) {
    if (expected === actual) return;
    expected = JSON.stringify(expected);
    actual = JSON.stringify(actual);
    throw new Error(`Expected: ${expected} Got: ${actual}`);
}

function test(text) {
    assert(text, getTerminalValue());
}

function testUndoRedo(...arr) {
    assert(arr.length, maxHistoryLength);
    assert(maxHistoryLength, historyIndex);
    const indexList = arr.map((_v, i) => i);

    indexList.toReversed().slice(1).forEach(i => {
        undoTerminalHistory();
        assert(i, historyIndex - 1);
        test(arr[i]);
        test(calculateTerminalLines(i).join('\n'));
    });

    indexList.slice(1).forEach(i => {
        redoTerminalHistory();
        assert(i, historyIndex - 1);
        test(arr[i]);
        test(calculateTerminalLines(i).join('\n'));
    });
}
