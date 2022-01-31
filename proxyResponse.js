console.log("inside proxy response 2")
let fullData = "";

function listener(details) {
    console.log("inside listener 2 !");
    let filter = browser.webRequest.filterResponseData(details.requestId);
    let decoder = new TextDecoder("utf-8");
    let encoder = new TextEncoder();

    filter.ondata = event => {
        console.log("on data !");
        let data = decoder.decode(event.data, {stream: true});
        // Just change any instance of Example in the HTTP response
        // to WebExtension Example.
        fullData += data
    }

    filter.onstop = event => {
        console.log("on close");
        let parsedData = JSON.parse(fullData);
        parsedData.data = sortByResistance(parsedData);
        let stringData = JSON.stringify(parsedData);
        filter.write(encoder.encode(stringData));
        filter.close();
        fullData = "";
    }
}

browser.webRequest.onBeforeRequest.addListener(
    listener,
    {urls: ["https://www.dofusbook.net/items/dofus/search/*"]},
    ["blocking"]
);

function sortByResistance(data) {
    let sortedData = Array.from(data.data);
    console.log('there is ' + sortedData.length + ' items to sort')

    sortedData.forEach(item => item.name += " (" + getSumOfRes(item) + "%)")
    sortedData.sort((a, b) => getSumOfRes(a) < getSumOfRes(b) ? 1 : -1);
    console.log('After sort, first item is ');
    console.log(sortedData[0]);
    return sortedData;
}

function getSumOfRes(item) {
    return item.effects
        .filter(effect => ["rnp", "rep", "rfp", "rap", "rtp",].includes(effect.name))
        .reduce((a, b) => parseInt(a) + parseInt(b.max), 0);
}

