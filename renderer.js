const options = {
    workerPath: "./node_modules/tesseract.js/dist/worker.min.js",
    // Unlike when used in a browser, corePath and langPath are resolved relative the worker using Electron.
    corePath: "../../../node_modules/tesseract.js-core/",
    langPath: "../../../lang-data",
    logger: m => console.log(m),
    // Disable gzip since the eng.traineddata file we are using is already uncompressed
    gzip: false,
    workerBlobURL: false
};

const config = {
    load_system_dawg: false,
    load_freq_dawg: false
};


/* (async () => {
    const worker = await Tesseract.createWorker("eng", undefined, options, config);
    const { data: { text } } = await worker.recognize("./squad.png");
    console.log(text);
    await worker.terminate();
})(); */

document.querySelector('button').addEventListener('click', () => {
    window.electronAPI.saveClipboardImage();
});
