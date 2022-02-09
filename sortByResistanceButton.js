let optionsMenu = document.getElementById("search-results").previousSibling;

// Create button only if it has not already been created
if (optionsMenu.childNodes.length === 4) {
    optionsMenu.removeChild(optionsMenu.lastChild);
}
if (optionsMenu.childNodes.length === 3) {
    let isCheckboxChecked = false;
    let sortByResistance = optionsMenu.appendChild(optionsMenu.lastChild.cloneNode(true)).firstChild;
    sortByResistance.removeChild(sortByResistance.lastChild);
    let checkbox = sortByResistance.firstChild.firstChild;
    checkbox.firstChild.classList.add("d-none");
    checkbox.lastChild.textContent = 'Trier par résistance'
    checkbox.addEventListener('click', () => {
        console.log('click when ' + isCheckboxChecked)
        if (isCheckboxChecked) {
            checkbox.firstChild.classList.add("d-none");
        } else {
            checkbox.firstChild.classList.remove("d-none");
        }
        isCheckboxChecked = !isCheckboxChecked;
        browser.runtime.sendMessage(isCheckboxChecked)
        location.reload();
    })
}
