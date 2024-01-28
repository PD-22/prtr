const background = document.querySelector('.scrape-modal-background');
const textarea = background.querySelector('textarea');
export const scrapeModal = { background, textarea, isOpen: false };

window.electron.onScrapeTesseractConfirm(parsedLines => {
    openScrapeModal(parsedLines.join('\n'));
});

export function openScrapeModal(value) {
    scrapeModal.isOpen = true;
    if (value != undefined) textarea.value = value;
    background.classList.add('opened');

    textarea.style.removeProperty('height');
    textarea.style.removeProperty('width');

    setTimeout(() => textarea.focus());
    textarea.style.height = textarea.scrollHeight + 'px';
    textarea.style.width = textarea.scrollWidth + 'px';
}

export function closeScrapModal() {
    scrapeModal.isOpen = false;
    background.classList.remove('opened');
}
