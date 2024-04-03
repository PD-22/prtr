const container = document.querySelector('.side-notes');

export default async function note(message, alive = 3000, id) {
    const alertBox = document.createElement('div');
    alertBox.className = 'note';
    alertBox.textContent = message;
    if (id) container.querySelectorAll('#' + (alertBox.id = id)).forEach(e => e.remove());
    if (!message) return;
    container.appendChild(alertBox);
    if (alive === Infinity) return alertBox.classList.add('permanent');

    await delay(alive);
    if (!container.contains(alertBox)) return;
    container.removeChild(alertBox);
}

function delay(t) {
    return new Promise(r => setTimeout(r, t));
}
