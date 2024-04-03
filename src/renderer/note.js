const container = document.querySelector('.side-notes');
const transition = 300;

export default async function note(message, alive = 3000, id) {
    const alertBox = document.createElement('div');
    alertBox.className = 'note';
    alertBox.textContent = message;
    if (id) container.querySelectorAll('#' + (alertBox.id = id)).forEach(e => e.remove());
    container.appendChild(alertBox);
    if (alive === Infinity) return alertBox.classList.add('permanent');

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
