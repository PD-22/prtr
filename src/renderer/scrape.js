import {
    lockLine,
    open,
    state,
    unlockLine,
    writeLine,
    writeText
} from "../terminal/index.js";
import { cancelable } from "./cancelable.js";
import { getParsedLines } from "./shortcutsTerminal.js";

export const SCRAPE = 'SCRAPE';

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
        const [cancel] = await cancelable(SCRAPE, promise);
        if (cancel) return status('Cancel');

        if (state.isOpen) return;
        open();
    } catch (error) {
        status('Error');
        throw error;
    }
}

const util = async (...ps) => {
    const [r, i] = await Promise.race(ps.map(async (p, i) => [(await p), i])); i
    return Array.from({ length: ps.length }).toSpliced(i, 1, r)
};

async function scrapeLine({ username, index }) {
    const write = (line, skipHistory) => writeLine(line, index, skipHistory, true);
    const init = () => { unlockLine(index); write(username, true); };

    try {
        write(fkv(username, '...'), true);

        const [abort, [cancel, data] = []] = await util(
            new Promise(resolve => lockLine(index, () => {
                resolve(true);
                init();
                status(fkv(username, 'Abort'));
            })),
            cancelable(SCRAPE, api.scrape(index, username), init)
        );

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
