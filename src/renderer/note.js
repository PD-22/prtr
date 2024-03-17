const container = document.querySelector('.note-container');

export default async function note(message, alive = 1000, transition = 300) {
    const alertBox = document.createElement('div');
    alertBox.className = 'note';
    alertBox.textContent = message;
    container.appendChild(alertBox);

    await delay(alive);
    alertBox.style.transition = `opacity ${transition}ms`;
    alertBox.style.opacity = '0';

    await delay(transition);
    container.removeChild(alertBox);
}

function delay(t) {
    return new Promise(r => setTimeout(r, t));
}
