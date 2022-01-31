let options = document.getElementById("search-results").previousSibling;

if (options.childNodes.length === 4) {
    options.removeChild(options.lastChild);
}
if (options.childNodes.length === 3) {
    let isCheckboxChecked = false;
    let sortByResistance = options.appendChild(options.lastChild.cloneNode(true)).firstChild;
    sortByResistance.removeChild(sortByResistance.lastChild);
    let checkbox = sortByResistance.firstChild.firstChild;
    checkbox.firstChild.classList.add("d-none");
    checkbox.lastChild.textContent = 'Sort by resistance'
    checkbox.addEventListener('click', () => {
        console.log('click when ' + isCheckboxChecked)
        if (isCheckboxChecked) {
            checkbox.firstChild.classList.add("d-none");
        } else {
            this.sortByResistance();
            checkbox.firstChild.classList.remove("d-none");
        }
        isCheckboxChecked = !isCheckboxChecked;
    })
}

function sortByResistance() {
    let searchResults = document.getElementById("search-results");
    let listOfCard = Array.from(searchResults.childNodes);
    console.log('there is ' + listOfCard.length + ' items to sort')
    listOfCard.sort((a, b) => getSumOfRes(a) < getSumOfRes(b) ? 1 : -1);
    console.log('After sort, first item is ' + listOfCard[0].firstChild.firstChild.firstChild.firstChild.textContent);
    listOfCard.forEach(child => child.firstChild.firstChild.firstChild.firstChild.firstChild.textContent += "(" + getSumOfRes(child) + "%)")
    listOfCard.forEach(child => searchResults.appendChild(child));
}

function getSumOfRes(div) {
    let effects = Array.from(div.firstChild.childNodes[2].firstChild.childNodes)
        .filter(div => div.lastElementChild != null);
    return effects.map(div => div.lastElementChild.textContent)
        .filter(text => text.includes(" % Rés. "))
        .map(text => toInt(text))
        .reduce((a, b) => a + b, 0);
}

function toInt(text) {
    let array = text.split(" ");
    return  parseInt(array[array.findIndex(char => char === "%") - 1]);
}
