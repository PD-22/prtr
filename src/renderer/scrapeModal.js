import keyboard from "./keyboard.js";

const container = document.querySelector('.scrape-modal');
const form = container.querySelector('form');
const textarea = container.querySelector('textarea');
const submitBtn = container.querySelector('button.submit');
const cancelBtn = container.querySelector('button.cancel');
export const modal = { container, form, textarea, submitBtn, cancelBtn };

form.addEventListener('submit', e => {
    e.preventDefault();
    const editedLines = textarea.value.split('\n');
    window.electron.scrape(editedLines);

    closeScrapModal();
});

cancelBtn.addEventListener('click', closeScrapModal);

window.electron.onScrapeTesseractConfirm(parsedLines => {
    openScrapeModal(parsedLines.join('\n'));
});

export function openScrapeModal(value) {
    keyboard.shortcutsDisabled = true;
    if (value != undefined) textarea.value = value;
    container.classList.add('opened');

    textarea.style.removeProperty('height');
    textarea.style.removeProperty('width');

    setTimeout(() => textarea.focus());
    textarea.style.height = textarea.scrollHeight + 'px';
    textarea.style.width = textarea.scrollWidth + 'px';
}

export function closeScrapModal() {
    keyboard.shortcutsDisabled = false;
    container.classList.remove('opened');
}
