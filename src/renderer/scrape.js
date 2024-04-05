import { lockLine, open, state, unlockLine, writeLine, writeText } from "../terminal/index.js";
import createCancelable from "./cancelable.js";
import { getParsedLines } from "./shortcutsTerminal.js";

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

const name = 'Scrape'
export default async function scrape() {
    const status = (message, permanent) => api.status(message, undefined, permanent, name);
    try {
        const parsedLines = getParsedLines();
        const lines = parsedLines.map(x => fkv(x.username, x.data));
        writeText(lines.join('\n'), undefined, undefined, true);

        const filteredLines = parsedLines
            .map((o, index) => ({ ...o, index }))
            .filter(o => o.username && !o.data);

        if (!filteredLines.length) return;

        if (enqueue(...filteredLines.map(scrapeLine))) return;

        status(`${name}...`, true);
        const [cancel] = await cancelable([process()]);
        if (cancel) return status(`${name} Cancel`);

        status(undefined, true);
        open();
    } catch (error) {
        status(`${name} Error`);
        throw error;
    }
}

async function scrapeLine({ username, index }) {
    const write = (text, { skipHistory, skipSelection = true, skipLock }) =>
        writeLine(text, index, skipHistory, skipSelection, skipLock);
    const init = () => { write(username, { skipHistory: true }); unlockLine(index); };
    const status = message => api.status(`${name} ${message}`);

    try {
        write(fkv(username, '...'), { skipHistory: true });

        const abortPromise = new Promise(r => lockLine(index, () => { init(); r(true); }));
        const scrapePromise = api.scrape(index, username);
        const [cancel, abort, data] = await cancelable([abortPromise, scrapePromise], init);

        if (abort) status(fkv(username, 'Abort'));
        if (abort || cancel) return;
        if (data instanceof Error) throw data;
        if (typeof data !== 'number') throw new Error(`${name} fail`);

        if (!state.isOpen) status(fkv(username, data));
        write(fkv(username, data), { skipLock: true });
    } catch (error) {
        console.error(error);
        status(fkv(username, 'Error'));
        init();
        throw error;
    } finally {
        unlockLine(index);
        api.abortScrape(index);
    }
}

function fkv(k, v) {
    return v != null ? `${k} - ${v}` : k;
}
