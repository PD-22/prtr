import { lockLine, open, unlockLine, writeLine, writeText } from "../terminal/index.js";
import createCancelable from "./cancelable.js";
import { getParsedLines } from "./shortcutsTerminal.js";

const status = (message, body) => api.status(`Scrape: ${message}`, body);

const [cancelable, cancel] = createCancelable();
export const cancelScrape = cancel;

const pending = [];
async function process() {
    while (pending.length) {
        const { length } = pending;
        await Promise.allSettled(pending);
        pending.splice(0, length);
    }
}
function enqueue(...promises) {
    const { length } = pending;
    pending.push(...promises);
    return length;
}

export default async function scrape() {
    try {
        const parsedLines = getParsedLines();
        const lines = parsedLines.map(x => fkv(x.username, x.data));
        writeText(lines.join('\n'), undefined, undefined, true);

        const filteredLines = parsedLines
            .map((o, index) => ({ ...o, index }))
            .filter(o => o.username && !o.data);

        if (!filteredLines.length) return status('Empty');

        if (enqueue(...filteredLines.map(scrapeLine))) return;

        status('Start');
        const [cancel] = await cancelable([process()]);
        if (cancel) return status('Cancel');

        status('Done');
        open();
    } catch (error) {
        status('Error');
        throw error;
    }
}

async function scrapeLine({ username, index }) {
    const write = (text, { skipHistory, skipSelection = true, skipLock }) =>
        writeLine(text, index, skipHistory, skipSelection, skipLock);
    const init = () => { write(username, { skipHistory: true }); unlockLine(index); };

    try {
        write(fkv(username, '...'), { skipHistory: true });

        const abortPromise = new Promise(r => lockLine(index, () => { init(); r(true); }));
        const scrapePromise = api.scrape(index, username);
        const [cancel, abort, data] = await cancelable([abortPromise, scrapePromise], init);

        if (abort) status(fkv(username, 'Abort'));
        if (abort || cancel) return;
        if (data instanceof Error) throw data;
        if (typeof data !== 'number') throw new Error('Scrape failed');

        status(fkv(username, data));
        write(fkv(username, data), { skipLock: true });
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
