const container = document.querySelector('.side-notes');

export default async function note(message, alive = 1000, transition = 300) {
    const alertBox = document.createElement('div');
    alertBox.className = 'note';
    alertBox.textContent = message;
    container.appendChild(alertBox);

    await delay(alive);
    alertBox.style.transition = `opacity ${transition}ms`;
    alertBox.style.opacity = '0';

    await delay(transition);
    if (!container.contains(alertBox)) return;
    container.removeChild(alertBox);
}

function delay(t) {
    return new Promise(r => setTimeout(r, t));
}
