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
        const promise = Promise.allSettled(filteredLines.map(scrapeLine));
        const [cancel] = await cancelable(TERMINAL, promise);
        if (cancel) return status('Cancel');

        if (state.isOpen) return;
        open();
    } catch (error) {
        status('Error');
        throw error;
    }
}

const ABORT = 'abort';
const CANCEL = 'cancel';
async function scrapeLine({ username, index }) {
    const write = (line, skipHistory) => writeLine(line, index, skipHistory, true);
    const abort = () => api.abortScrape(index);

    try {
        write(fkv(username, '...'), true);
        lockLine(index, abort);

        const [cancel, data] = await cancelable(TERMINAL, api.scrape(index, username));
        if (cancel) { abort(); throw new Error(CANCEL); }
        if (data === ABORT) throw new Error(ABORT);
        if (data instanceof Error) throw data;
        if (typeof data !== 'number') throw new Error('Scrape failed');

        status(fkv(username, data));
        unlockLine(index);
        write(fkv(username, data));
    } catch (error) {
        unlockLine(index);
        write(username, true);

        if (error.message === CANCEL) return;
        if (error.message === ABORT) return status(fkv(username, error.message));
        status(fkv(username, 'error'));
        console.error(error);
    } finally {
        unlockLine(index);
    }
}

function fkv(k, v) {
    return v != null ? `${k} - ${v}` : k;
}
