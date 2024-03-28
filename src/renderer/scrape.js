import {
    lockLine,
    open,
    state,
    unlockLine,
    writeLine,
    writeText
} from "../terminal/index.js";
import createCancelable from "./cancelable.js";
import { getParsedLines } from "./shortcutsTerminal.js";

const status = (message, body) => api.status(`Scrape: ${message}`, body);

const [cancelable, cancel] = createCancelable();
export const cancelScrape = cancel;

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
        const [cancel] = await cancelable([promise]);
        if (cancel) return status('Cancel');

        if (state.isOpen) return;
        open();
    } catch (error) {
        status('Error');
        throw error;
    }
}

async function scrapeLine({ username, index }) {
    const write = (line, skipHistory) => writeLine(line, index, skipHistory, true);
    const init = () => { unlockLine(index); write(username, true); };

    try {
        write(fkv(username, '...'), true);

        const abortPromise = new Promise(r => lockLine(index, () => { init(); r(true); }));
        const scrapePromise = api.scrape(index, username);
        const [cancel, abort, data] = await cancelable([abortPromise, scrapePromise], init);

        if (abort) status(fkv(username, 'Abort'));
        if (abort || cancel) return;
        if (data instanceof Error) throw data;
        if (typeof data !== 'number') throw new Error('Scrape failed');

        status(fkv(username, data));
        unlockLine(index);
        write(fkv(username, data));
    } catch (error) {
        init();
        status(fkv(username, 'Error'));
        console.error(error);
    } finally {
        unlockLine(index);
        api.abortScrape(index);
    }
}

function fkv(k, v) {
    return v != null ? `${k} - ${v}` : k;
}
