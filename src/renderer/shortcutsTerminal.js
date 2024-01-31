import { remindShortcuts } from "./shortcuts.js";
import { closeTerminal, getTerminalLines, openTerminal, terminal, writeTerminalLine, writeTerminalLines } from "./terminal.js";

export default [
    ['Enter', 'Scrape', async () => {
        try {
            await scrape();
        } catch (error) {
            window.electron.status('Scrape: ERROR');
            throw error;
        }
    }],
    ['Alt+Enter', 'Rescrape', async () => {
        try {
            await scrape(true);
        } catch (error) {
            window.electron.status('Scrape: ERROR');
            throw error;
        }
    }],
    ['Ctrl+Shift+ArrowUp', 'Ascending', () => sortData()],
    ['Ctrl+Shift+ArrowDown', 'Descending', () => sortData(false)],
    ['Escape', 'Close', () => {
        if (!terminal.isOpen) return;
        closeTerminal();
        remindShortcuts();
    }]
];

function sortData(ascending = true) {
    const parsedLines = parseLines(getTerminalLines());
    const sorted = parsedLines
        .sort((a, b) => a.username.localeCompare(b.username))
        .sort((a, b) => (b.data ?? 0) - (a.data ?? 0));
    if (!ascending) sorted.reverse();
    const lines = sorted.map(x => fkv(x.username, x.data));
    writeTerminalLines(lines);
}

async function scrape(removeData = false) {
    const parsedLines = parseLines(getTerminalLines());
    const lines = parsedLines.map(x => fkv(x.username, x.data));
    window.electron.status('Scrape: INIT', lines);
    writeTerminalLines(lines);

    const filteredLines = parsedLines
        .map((o, index) => ({ ...o, index }))
        .filter(o => removeData || !o.data);

    if (!filteredLines.length) return window.electron.status("Scrape: EMPTY");

    window.electron.status('Scrape: START');
    await Promise.allSettled(filteredLines.map(async ({ username, index }) => {
        writeTerminalLine(index, fkv(username, '...'));

        const newData = await window.electron.scrape(username);

        const newLine = fkv(username, newData);
        window.electron.status(`Scrape: ${newLine}`);
        writeTerminalLine(index, newLine);
    }));

    if (terminal.isOpen) return;
    openTerminal();
    remindShortcuts();
}

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
