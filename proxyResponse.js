console.log("inside proxy response 2")
let fullData = {};
let authHeader = [];

function listener(details) {
    // details.originUrl = "https://www.dofusbook.net/fr/encyclopedie/recherche?context=cloth&display=mosaic&sort=desc";
    // details.documentUrl = "https://www.dofusbook.net/fr/encyclopedie/recherche?context=cloth&display=mosaic&sort=desc";
    let filter = browser.webRequest.filterResponseData(details.requestId);
    let decoder = new TextDecoder("utf-8");
    let encoder = new TextEncoder();

    filter.ondata = event => {
        let data = decoder.decode(event.data, {stream: true});
        // Just change any instance of Example in the HTTP response
        // to WebExtension Example.
        fullData[details.requestId] = fullData[details.requestId] === undefined ? data :  fullData[details.requestId] + data;
    }

    filter.onstop = event => {
        let parsedData = JSON.parse(fullData[details.requestId]);
        
        // make more requests and mock backend sort
        const params = new Proxy(new URLSearchParams(details.url), {
            get: (searchParams, prop) => searchParams.get(prop),
        });
        if (params.page == 1) {
            for (let i = 2; i <= 3; i++) {
                let httpRequest = new XMLHttpRequest();
                httpRequest.open("GET", details.url.replace('page=1', 'page=' + i), false);
                authHeader.forEach(header => httpRequest.setRequestHeader(header.name, header.value))
                httpRequest.send(null);
                // get page i
                console.log(httpRequest.response)
                parsedData.data = parsedData.data.concat(JSON.parse(httpRequest.response).data);
            }
            parsedData.data = sortByResistance(parsedData);
        }
        let stringData = JSON.stringify(parsedData);
        filter.write(encoder.encode(stringData));
        filter.close();
        fullData[details.requestId] = undefined;
    }
}

browser.webRequest.onBeforeSendHeaders.addListener(
    e => {
        authHeader = e.requestHeaders;
        console.log("saving header")
        e.requestHeaders.push({name: "Referer", value: "https://www.dofusbook.net/fr/"})
        return {requestHeaders: e.requestHeaders};
    },
    {urls: ["https://www.dofusbook.net/items/dofus/search/*", "https://www.dofusbook.net/api/cloths*"]},
    ["blocking", "requestHeaders"]
);


browser.webRequest.onBeforeRequest.addListener(
    listener,
    {urls: ["https://www.dofusbook.net/items/dofus/search/*", "https://www.dofusbook.net/api/cloths*"]},
    ["blocking"]
);

function sortByResistance(data) {
    let sortedData = Array.from(data.data);
    console.log('there is ' + sortedData.length + ' items to sort')

    sortedData.forEach(item => item.name += " (" + getSumOfRes(item) + "%)")
    sortedData.sort((a, b) => sortItems(a, b));
    return sortedData;
}

function sortItems(a, b) {
    if (getLevelOf(a) < getLevelOf(b)) {
        return 1;
    } else if (getLevelOf(a) > getLevelOf(b)) {
        return -1;
    }
    return getSumOfRes(a) < getSumOfRes(b) ? 1 : -1;
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
