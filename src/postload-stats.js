const token = getToken();
window.electron.onScrape(async (row, line) => {
    const controller = new AbortController();
    window.electron.onAbort(row, () => controller.abort());
    return getUserTime(line, token, controller.signal);
});
token;

function getToken() {
    for (const script of document.body.querySelectorAll('script')) {
        const result = script.textContent.match(/"_token"\s*:\s*"(\w+)"/)?.[1];
        if (result) return result;
    }
}

async function getUserTime(username, token, signal) {
    try {
        const searchResults = await searchUser(username, token, signal);
        const foundUser = searchResults.find(x => x.label === username);
        const userPageUrl = foundUser.value.replace('http', 'https');
        return await extractUserTime(userPageUrl, signal);
    } catch (error) {
        return null;
    }
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
