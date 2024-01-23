import { createWorker } from 'tesseract.js';

(async () => {
    const config = { load_system_dawg: false, load_freq_dawg: false };
    const worker = await createWorker('eng', undefined, undefined, config);
    const ret = await worker.recognize('squad.png');
    console.log(ret.data.text);
    await worker.terminate();
})();
