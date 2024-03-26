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

const status = (message, body) => api.status(`Scrape: ${message}`, body);

export default async function scrape() {
    try {
        const parsedLines = getParsedLines();
        const lines = parsedLines.map(x => fkv(x.username, x.data));
        writeText(lines.join('\n'), null, null, true);

        const filteredLines = parsedLines
            .map((o, index) => ({ ...o, index }))
            .filter(o => o.username && !o.data);

        if (!filteredLines.length) return status('Empty');

        status('Start', filteredLines.map(x => x.username));
        await Promise.allSettled(filteredLines.map(scrapeLine));

        if (state.isOpen) return;
        open();
    } catch (error) {
        status('Error');
        throw error;
    }
}

const ABORT_MSG = 'abort';
async function scrapeLine({ username, index }) {
    const write = (line, skipHistory) => writeLine(line, index, skipHistory, true);
    const abort = () => api.abortScrape(index);

    try {
        write(fkv(username, '...'), true);
        lockLine(index, abort);

        const [cancel, data] = await cancelable(TERMINAL, api.scrape(index, username));
        if (cancel) abort();
        if (cancel || data === ABORT_MSG) throw new Error(ABORT_MSG);
        if (data instanceof Error) throw data;
        if (typeof data !== 'number') throw new Error('Scrape failed');

        status(fkv(username, data));
        unlockLine(index);
        write(fkv(username, data));
    } catch (error) {
        const isAbort = error.message === ABORT_MSG;
        if (!isAbort) console.error(error);
        status(fkv(username, isAbort ? ABORT_MSG : 'error'));

        unlockLine(index);
        write(username, true);
    } finally {
        unlockLine(index);
    }
}

function fkv(k, v) {
    return v != null ? `${k} - ${v}` : k;
}
