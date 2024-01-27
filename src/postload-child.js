window.electron.onScrapeUsernames(async usernames => {
    window.electron.status('Get user time stats');
    const result = await getPrTimeStats(usernames, getToken());
    window.electron.receiveResult(result);
    window.electron.status(`Time stats:\n${result.split('\n').map(x => `\t${x}`).join('\n')}`);
})

function getToken() {
    for (const script of document.body.querySelectorAll('script')) {
        const result = script.textContent.match(/"_token"\s*:\s*"(\w+)"/)?.[1];
        if (result) return result;
    }
}

async function getPrTimeStats(usernameList, token, requestLimit) {
    const formatUserTime = (username, time) => `${username}: ${time}`;

    const userTimeEntries = await runAsyncFuncsInParallel(
        usernameList.map(username => async () => {
            const time = await getUserTime(username, token);
            window.electron.status(formatUserTime(username, time));
            return { username, time };
        }),
        requestLimit
    );

    const sortedTimeDesc = sortBy(userTimeEntries, 'time');

    return sortedTimeDesc.map(({ username, time }) => formatUserTime(username, time)).join('\n');
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
        const cleanUsername = removeClanTag(username);
        const searchResults = await searchUser(cleanUsername, token);
        const foundUser = searchResults.find(x => x.label === cleanUsername);
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

function removeClanTag(usernameWithClanTag) {
    return usernameWithClanTag.split(' ').slice(-1)[0];
}

function sortBy(list, key) {
    return list.slice().sort((a, b) => b[key] - a[key]);
}
