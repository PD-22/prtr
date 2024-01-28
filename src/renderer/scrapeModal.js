const element = document.querySelector('.scrape-modal');
export const scrapeModal = { element, isOpen: false };

window.electron.onScrapeTesseractConfirm(parsedLines => {
    openScrapeModal(parsedLines.join('\n'));
});

export function openScrapeModal(value) {
    scrapeModal.isOpen = true;
    if (value != undefined) element.value = value;
    element.classList.add('opened');
    setTimeout(() => element.focus());
}

export function closeScrapModal() {
    scrapeModal.isOpen = false;
    element.classList.remove('opened');
}

export function writeScrapModal(text) {
    element.value = text;
}

export function appendScrapModal(text) {
    element.value += text;
}
