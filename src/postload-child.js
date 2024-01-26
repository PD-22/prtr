const token = 'Bl5D5LjEYdOXjDiZ72eLHtZH7zL4lMBHorU18Rml';
(async () => {
    const usernames = getUsernames(window.location.search);
    window.electron.status('Get user time stats');
    const result = await getPrTimeStats(usernames, token);
    window.electron.receiveResult(result);
    window.electron.status(`Time stats:\n${result.split('\n').map(x => `\t${x}`).join('\n')}`);
})();

function getUsernames(queryString) {
    const searchParams = new URLSearchParams(queryString);
    const paramName = 'scrape_usernames';
    const param = searchParams.get(paramName);
    return param.split(',').map(str => decodeURIComponent(str));
}

async function getPrTimeStats(usernameList, token, requestLimit) {
    const userTimeEntries = await runAsyncFuncsInParallel(
        usernameList.map(username => async () => {
            const time = await getUserTime(username, token);
            return { username, time };
        }),
        requestLimit
    );

    const sortedTimeDesc = sortBy(userTimeEntries, 'time');

    return sortedTimeDesc.map(({ username, time }) => `${username}: ${time}`).join('\n');
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
        window.electron.status(`Failed to get user time for ${username}: ${error.message}`);
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
        body: createUrlSearchParams({ search: username, _token: token })
    };
    const response = await fetch("https://prstats.tk/json/search", options);
    return await response.json();
}

function removeClanTag(usernameWithClanTag) {
    return usernameWithClanTag.split(' ').slice(-1)[0];
}

function createUrlSearchParams(object) {
    const result = new URLSearchParams();
    for (const [name, value] of Object.entries(object))
        result.append(name, value);
    return result;
}

function sortBy(list, key) {
    return list.slice().sort((a, b) => b[key] - a[key]);
}
