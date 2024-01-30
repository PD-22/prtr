import { remindShortcuts } from "./shortcuts.js";
import { closeTerminal, getTerminalLines, openTerminal, terminal, writeTerminalLine, writeTerminalLines } from "./terminal.js";

export default [
    ['Enter', 'Scrape', async () => {
        try {
            const unique = arr => Array.from(new Set(arr.filter(Boolean)));
            const extractUsername = str => {
                const whitespace = str => str.trim().replace(/\s+/g, ' ');
                const match = whitespace(str).match(/(.*?)(\s+-\s+\S*)?$/)?.[1];
                if (!match) return '';
                const [first, ...rest] = match.split(' ');
                return rest.join('') || first;
            };

            const lines = unique(getTerminalLines().map(extractUsername));
            if (!lines.length) return window.electron.status("Scrape: EMPTY");
            window.electron.status('Scrape: INIT', lines);
            writeTerminalLines(lines);

            window.electron.status('Scrape: START');
            const initLines = getTerminalLines();
            await Promise.allSettled(initLines.map(async (line, index) => {
                const data = await window.electron.scrape(line);
                const newLine = `${line} - ${data}`;
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
