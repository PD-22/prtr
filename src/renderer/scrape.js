import {
    lockLine,
    open,
    state,
    unlockLine,
    writeLine,
    writeText
} from "../terminal/index.js";
import { cancelable } from "./cancelable.js";
import { TERMINAL, getParsedLines } from "./shortcutsTerminal.js";

export default async function scrape() {
    try {
        const parsedLines = getParsedLines();
        const lines = parsedLines.map(x => fkv(x.username, x.data));
        api.status('Scrape: INIT', lines);
        writeText(lines.join('\n'), null, null, true);

        const filteredLines = parsedLines
            .map((o, index) => ({ ...o, index }))
            .filter(o => o.username && !o.data);

        if (!filteredLines.length) return api.status("Scrape: EMPTY");

        api.status('Scrape: START', filteredLines.map(x => x.username));
        await Promise.allSettled(filteredLines.map(scrapeLine));

        if (state.isOpen) return;
        open();
    } catch (error) {
        api.status('Scrape: ERROR');
        throw error;
    }
}

const ABORT = "ABORT";
async function scrapeLine({ username, index }) {
    const write = (line, skipHistory) => writeLine(line, index, skipHistory, true);
    const abort = () => api.abortScrape(index);

    try {
        write(fkv(username, '...'), true);
        lockLine(index, abort);

        const [cancel, data] = await cancelable(TERMINAL, api.scrape(index, username));
        if (cancel) abort();
        if (cancel || data === ABORT) throw new Error(ABORT);
        if (data instanceof Error) throw data;
        if (typeof data !== 'number') throw new Error('Scrape failed');

        api.status(`Scrape: ${fkv(username, data)}`);
        unlockLine(index);
        write(fkv(username, data));
    } catch (error) {
        const isAbort = error.message === ABORT;
        if (!isAbort) console.error(error);
        api.status(`Scrape: ${fkv(username, isAbort ? ABORT : 'ERROR')}`);

        unlockLine(index);
        write(username, true);
    } finally {
        unlockLine(index);
    }
}

function fkv(k, v) {
    return v != null ? `${k} - ${v}` : k;
}
