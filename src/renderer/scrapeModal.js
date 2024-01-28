import keyboard from "./keyboard.js";

const scrapeModal = { container: document.querySelector('.scrape-modal') };
scrapeModal.form = scrapeModal.container.querySelector('form');
scrapeModal.textarea = scrapeModal.container.querySelector('textarea');
scrapeModal.submitBtn = scrapeModal.container.querySelector('button.submit');
scrapeModal.cancelBtn = scrapeModal.container.querySelector('button.cancel');

scrapeModal.form.addEventListener('submit', e => {
    e.preventDefault();
    const editedLines = scrapeModal.textarea.value.split('\n');
    window.electron.scrape(editedLines);

    closeScrapModal();
});

scrapeModal.cancelBtn.addEventListener('click', closeScrapModal);

window.electron.onScrapeTesseractConfirm(parsedLines => {
    openScrapeModal(parsedLines.join('\n'));
});

export function openScrapeModal(value) {
    keyboard.shortcutsDisabled = true;
    if (value != undefined) scrapeModal.textarea.value = value;
    scrapeModal.container.classList.add('opened');

    setTimeout(() => scrapeModal.textarea.focus());
    scrapeModal.textarea.style.height = scrapeModal.textarea.scrollHeight + 'px';
    scrapeModal.textarea.style.width = scrapeModal.textarea.scrollWidth + 'px';
}

function closeScrapModal() {
    keyboard.shortcutsDisabled = false;
    scrapeModal.container.classList.remove('opened');
}
