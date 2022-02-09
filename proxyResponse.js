/* TODO
 * add button to switch mode (normal/pvp)
 * add button to switch mode between cloth_effect/full_effects
 */

let fullData = {};
let authHeader = [];

function listener(details) {
    let filter = browser.webRequest.filterResponseData(details.requestId);
    let decoder = new TextDecoder("utf-8");
    let encoder = new TextEncoder();
    const params = new Proxy(new URLSearchParams(details.url), {
        get: (searchParams, prop) => searchParams.get(prop),
    });

    filter.ondata = event => {
        let data = decoder.decode(event.data, {stream: true});
        fullData[details.requestId] = fullData[details.requestId] === undefined ? data :  fullData[details.requestId] + data;
    }

    filter.onstop = event => {
        let parsedData = JSON.parse(fullData[details.requestId]);
        if (params.page == 1) {
            for (let i = 2; i <= 3; i++) {
                // send a new http request
                let httpRequest = new XMLHttpRequest();
                httpRequest.open("GET", details.url.replace('page=1', 'page=' + i), false);
                authHeader.forEach(header => httpRequest.setRequestHeader(header.name, header.value))
                httpRequest.send(null);
                // merge with previous data
                parsedData.data = parsedData.data.concat(JSON.parse(httpRequest.response).data);
            }
            // sort once we get all data
            parsedData.data = sortByResistance(parsedData);
        }
        filter.write(encoder.encode(JSON.stringify(parsedData)));
        filter.close();
        fullData[details.requestId] = undefined;
    }
}

browser.webRequest.onBeforeSendHeaders.addListener(
    e => {
        authHeader = e.requestHeaders;
        e.requestHeaders.push({name: "Referer", value: "https://www.dofusbook.net/fr/"})
        return {requestHeaders: e.requestHeaders};
    },
    {urls: ["https://www.dofusbook.net/items/dofus/search/*", "https://www.dofusbook.net/api/cloths*"]},
    ["blocking", "requestHeaders"]
);

browser.runtime.onMessage.addListener((request, _, __) => {
    console.log("request")
    console.log(request)
    if (request === true && !browser.webRequest.onBeforeRequest.hasListener(listener)) {
        console.log("consumer has been added")
        browser.webRequest.onBeforeRequest.addListener(
            listener,
            {urls: ["https://www.dofusbook.net/items/dofus/search/*", "https://www.dofusbook.net/api/cloths*"]},
            ["blocking"]
        )
    } else if (request === false && browser.webRequest.onBeforeRequest.hasListener(listener)) {
        console.log("consumer has been removed")
        browser.webRequest.onBeforeRequest.removeListener(listener)
    }
})

function sortByResistance(data) {
    let sortedData = Array.from(data.data);
    console.log('there is ' + sortedData.length + ' items to sort')

    sortedData.forEach(item => item.name += " (" + getSumOfRes(item) + "%)")
    sortedData.sort((a, b) => sortItems(a, b));
    return sortedData;
}

function sortItems(a, b) {
    if (getSumOfRes(a) < getSumOfRes(b)) {
        return 1;
    } else if (getSumOfRes(a) > getSumOfRes(b)) {
        return -1;
    }
    return getLevelOf(a) < getLevelOf(b) ? 1 : -1;
}

function getLevelOf(item) {
    return item.level;
}

function getSumOfRes(clothOrItem) {
    return clothOrItem.count_item != null ? getSumOfClothRes(clothOrItem) : getSumOfItemRes(clothOrItem);
}

function getSumOfClothRes(cloth) {
    let sumOfItems = cloth.items.map(i => getSumOfRes(i)).reduce((a, b) => a + b, 0);
    let sumOfClothEffect = getSumOfRes(mockItem(cloth));
    return Math.round((sumOfItems + sumOfClothEffect) / cloth.count_item);
}

function getSumOfItemRes(item) {
    return item.effects
        .filter(effect => ["rnp", "rep", "rfp", "rap", "rtp",].includes(effect.name))
        .reduce((a, b) => parseInt(a) + parseInt(b.max), 0);
}

function mockItem(cloth) {
    let fakeItem = {effects: cloth.cloth_effect};
    fakeItem.effects.forEach(b => b.max = b.value)
    return fakeItem;
}
