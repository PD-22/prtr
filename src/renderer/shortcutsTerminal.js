import { extractUsername, remindShortcuts, unique } from "./shortcuts.js";
import { closeTerminal, getTerminalLines, openTerminal, terminal, writeTerminalLines } from "./terminal.js";

export default [
    ['Enter', 'Scrape', async () => {
        try {
            const lines = unique(getTerminalLines().map(extractUsername));
            if (!lines.length) return window.electron.status("Scrape: EMPTY");
            window.electron.status('Scrape: INIT', lines);
            writeTerminalLines(lines);

            const result = await window.electron.scrape(getTerminalLines());

            writeTerminalLines(result);
            if (!terminal.isOpen) {
                openTerminal();
                remindShortcuts();
            }
        } catch (error) {
            window.electron.status('Scrape: ERROR');
            throw error;
        }
    }],
    ['Escape', 'Image', () => {
        if (terminal.isOpen) {
            closeTerminal();
            remindShortcuts();
        }
    }]
];
