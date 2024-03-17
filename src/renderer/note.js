const container = document.body;
const transitionDuration = 300;

export default async function note(message, duration = 1000) {
    const alertBox = document.createElement('div');
    alertBox.className = 'note';
    alertBox.textContent = message;
    container.appendChild(alertBox);

    await delay(duration);
    alertBox.style.transition = `opacity ${transitionDuration}ms`;
    alertBox.style.opacity = '0';

    await delay(transitionDuration);
    container.removeChild(alertBox);
}

function delay(t) {
    return new Promise(r => setTimeout(r, t));
}
