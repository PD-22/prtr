console.log('postload-child.js loaded');

(async () => {
    const usernameList = ['Unicode'];
    const token = 'Bl5D5LjEYdOXjDiZ72eLHtZH7zL4lMBHorU18Rml';
    const result = await getPrTimeStats(usernameList, token);
    window.electron.receiveResult(result);
})()

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
        console.error(`Failed to get user time for ${username}: ${error.message}`);
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
    const baseUrl = "https://prstats.tk/";
    const url = `${baseUrl}json/search`;
    const headers = {
        "accept": "application/json, text/javascript, */*; q=0.01",
        "accept-language": "en-US",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "sec-ch-ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest"
    };
    const options = {
        headers: headers,
        referrer: baseUrl,
        referrerPolicy: "strict-origin-when-cross-origin",
        body: `search=${username}&_token=${token}`,
        method: "POST",
        mode: "cors",
        credentials: "include"
    };
    const response = await fetch(url, options)
    return await response.json();
}

async function searchUserOriginal(username, token) {
    return await post(
        "https://prstats.tk/json/search",
        createFormData({ search: username, _token: token })
    );
}

async function post(url, body) {
    const response = await fetch(url, { method: "POST", body });
    return await response.json();
}

function removeClanTag(usernameWithClanTag) {
    return usernameWithClanTag.split(' ').slice(-1)[0];
}

function createFormData(object) {
    const result = new FormData();
    for (const [name, value] of Object.entries(object))
        result.append(name, value);
    return result;
}

function sortBy(list, key) {
    return list.slice().sort((a, b) => b[key] - a[key]);
}
