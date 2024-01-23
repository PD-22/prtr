import { createWorker } from 'tesseract.js';

(async () => {
    const worker = await createWorker('eng');
    const ret = await worker.recognize('squad.png');
    console.log(ret.data.text);
    await worker.terminate();
})();
