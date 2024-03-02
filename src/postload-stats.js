const token = getToken();
window.electron.onScrape((username) => {
    const controller = new AbortController();
    const promise = getUserTime(username, token, controller.signal)
    const abort = () => controller.abort();
    return [promise, abort];
});
token;

function getToken() {
    for (const script of document.body.querySelectorAll('script')) {
        const result = script.textContent.match(/"_token"\s*:\s*"(\w+)"/)?.[1];
        if (result) return result;
    }
}

async function getUserTime(username, token, signal) {
    const searchResults = await searchUser(username, token, signal);
    const foundUser = searchResults.find(x => x.icon === 'user' && x.label === username);
    if (!foundUser) throw new Error(`User "${username}" not found`);

    const userPageUrl = foundUser.value.replace('http', 'https');
    return await extractUserTime(userPageUrl, signal);
}

async function extractUserTime(userPageUrl, signal) {
    const document = await fetchPage(userPageUrl, signal);
    const allElements = Array.from(document.getElementsByTagName("*"));
    const inGameTimeElt = allElements.find(elt => elt.textContent === "IN-GAME TIME");
    const timeElement = inGameTimeElt.previousElementSibling.querySelector('abbr');
    return parseInt(timeElement.title);
}

async function fetchPage(url, signal) {
    const response = await fetch(url, { signal });
    const htmlText = await response.text();
    const parser = new DOMParser();
    return parser.parseFromString(htmlText, "text/html");
}

async function searchUser(username, token, signal) {
    const options = {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ search: username, _token: token }),
        signal
    };
    const response = await fetch("/json/search", options);
    return await response.json();
}
