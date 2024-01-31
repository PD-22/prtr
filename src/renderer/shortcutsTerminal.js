import { remindShortcuts } from "./shortcuts.js";
import { closeTerminal, getTerminalLines, openTerminal, terminal, writeTerminalLine, writeTerminalLines } from "./terminal.js";

export default [
    ['Enter', 'Scrape', async () => {
        try {
            const parsedLines = parseLines(getTerminalLines());
            if (!parsedLines.length) return window.electron.status("Scrape: EMPTY");

            const lines = parsedLines.map(x => fkv(x.username, x.data));
            window.electron.status('Scrape: INIT', lines);
            writeTerminalLines(lines);

            window.electron.status('Scrape: START');
            await Promise.allSettled(parsedLines.map(async ({ username, data }, index) => {
                if (data) return;

                writeTerminalLine(index, fkv(username, '...'));

                const newData = await window.electron.scrape(username);

                const newLine = fkv(username, newData);
                window.electron.status(`Scrape: ${newLine}`);
                writeTerminalLine(index, newLine);
            }));

            if (terminal.isOpen) return;
            openTerminal();
            remindShortcuts();
        } catch (error) {
            window.electron.status('Scrape: ERROR');
            throw error;
        }
    }],
    ['Escape', 'Close', () => {
        if (!terminal.isOpen) return;
        closeTerminal();
        remindShortcuts();
    }]
];

function parseLines(lines) {
    const mappedLines = lines.map(line => {
        const [username, data] = parseUser(line);
        return { username, data };
    });

    const filteredLines = mappedLines.filter(x => x.username)

    return unique(filteredLines, x => x.username);
}

function parseUser(str) {
    const normal = whitespace(str);
    const match = normal.match(/^(.*?)((^|\s+)-\s*(\S*))?$/);
    const user = match?.[1];
    const data = match?.[4];

    if (!user) return [];

    const [first, ...rest] = user.split(' ');
    const username = rest.join('') || first;

    return [username, data];
}

function unique(arr, getKey) {
    const entries = arr.map((...args) => {
        const [v] = args;
        return [getKey(...args), v];
    });
    return Array.from(new Map(entries).values());
}

function fkv(k, v) {
    return v ? `${k} - ${v}` : k;
}

function whitespace(str) {
    return str.trim().replace(/\s+/g, ' ');
}
