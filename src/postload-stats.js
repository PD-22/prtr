const token = getToken();

window.electron.onScrape(username => getUserTime(username, token));

function getToken() {
    for (const script of document.body.querySelectorAll('script')) {
        const result = script.textContent.match(/"_token"\s*:\s*"(\w+)"/)?.[1];
        if (result) return result;
    }
}

async function getUserTime(username, token) {
    try {
        const searchResults = await searchUser(username, token);
        const foundUser = searchResults.find(x => x.label === username);
        const userPageUrl = foundUser.value.replace('http', 'https');
        return await extractUserTime(userPageUrl);
    } catch (error) {
        return null;
    }
}

async function extractUserTime(userPageUrl) {
    const document = await fetchPage(userPageUrl);
    const allElements = Array.from(document.getElementsByTagName("*"));
    const inGameTimeElt = allElements.find(elt => elt.textContent === "IN-GAME TIME");
    const timeElement = inGameTimeElt.previousElementSibling.querySelector('abbr');
    return parseInt(timeElement.title);
}

async function fetchPage(url) {
    const response = await fetch(url);
    const htmlText = await response.text();
    const parser = new DOMParser();
    return parser.parseFromString(htmlText, "text/html");
}

async function searchUser(username, token) {
    const options = {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ search: username, _token: token })
    };
    const response = await fetch("/json/search", options);
    return await response.json();
}
