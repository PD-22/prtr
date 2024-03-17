const sideCont = document.querySelector('.side-notes');
const centerCont = document.querySelector('.center-notes');

export default async function note(message, alive = 1000, transition = 300, center = false) {
    const container = center ? centerCont : sideCont;
    if (center) centerCont.replaceChildren();

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
