import {
    lockLine,
    open,
    state,
    unlockLine,
    writeLine,
    writeText
} from "../terminal/index.js";
import cancelable from "./cancelable.js";
import { getParsedLines } from "./shortcutsTerminal.js";

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

async function scrapeLine({ username, index }) {
    const write = (line, skipHistory) => writeLine(line, index, skipHistory, true);
    const abort = () => api.abortScrape(index);

    try {
        write(fkv(username, '...'), true);
        lockLine(index, abort);

        const [cancel, data] = await cancelable(api.scrape(index, username));
        if (cancel) abort();
        if (typeof data !== 'number') throw new Error('Scrape failed');
        if (data instanceof Error) throw data;

        api.status(`Scrape: ${fkv(username, data)}`);
        unlockLine(index);
        write(fkv(username, data));
    } catch (error) {
        const isAbort = error.message === "Error invoking remote method 'scrape': abort";
        if (!isAbort) console.error(error);
        api.status(`Scrape: ${fkv(username, isAbort ? 'ABORT' : 'ERROR')}`);

        unlockLine(index);
        write(username, true);
    } finally {
        unlockLine(index);
    }
}

function fkv(k, v) {
    return v != null ? `${k} - ${v}` : k;
}
