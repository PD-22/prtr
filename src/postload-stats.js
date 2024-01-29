window.electron.onScrapeUsernames(async usernames => {
    window.electron.status('Scrape: FETCH');
    const timeStats = await getPrTimeStats(usernames, getToken());
    window.electron.receiveResult(timeStats);
    window.electron.status('Scrape: DONE', timeStats);
});

window.electron.statsPageLoaded();

function getToken() {
    for (const script of document.body.querySelectorAll('script')) {
        const result = script.textContent.match(/"_token"\s*:\s*"(\w+)"/)?.[1];
        if (result) return result;
    }
}

async function getPrTimeStats(usernameList, token, requestLimit) {
    const formatUserTime = (username, time) => `${username} - ${time}`;

    const userTimeEntries = await runAsyncFuncsInParallel(
        usernameList.map(username => async () => {
            const time = await getUserTime(username, token);
            window.electron.status(`Scrape: ${formatUserTime(username, time)}`);
            return { username, time };
        }),
        requestLimit
    );

    return userTimeEntries.map(({ username, time }) => formatUserTime(username, time));
}

async function runAsyncFuncsInParallel(funcList = [], limit) {
    if (!(limit > 0)) limit = funcList.length;

    const results = [];
    let index = 0;

    async function runNextFunc() {
        const currIndex = index++;
        if (currIndex >= funcList.length) return;

        results[currIndex] = await funcList[currIndex]();

        await runNextFunc();
    }

    await Promise.all(Array(limit).fill().map(runNextFunc));

    return results;
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
    const response = await fetch("https://prstats.tk/json/search", options);
    return await response.json();
}
