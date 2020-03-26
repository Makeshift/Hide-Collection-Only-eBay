let hidden = false;
chrome.storage.sync.get(["hidden"], result => {
    if (typeof result.hidden === "undefined") {
        chrome.storage.sync.set({hidden: hidden}, () => {});
    } else {
        hidden = result.hidden;
    }

    toggleVisible(hidden);

});

function createOrGetButton() {
    let button = document.getElementById("hideCollectionOnlyButton");
    if (!button) {
        let tabs = document.getElementsByClassName("fake-tabs__items")[0];
        let item = document.createElement('li');
        item.className = "fake-tabs__item btn"
        item.id = "hideCollectionOnlyButton";
        
        item.onclick = function() {
            hidden = !hidden;
            chrome.storage.sync.set({hidden: hidden}, () => {})
            toggleVisible(hidden)
        }
        tabs.appendChild(item);
        button = document.getElementById("hideCollectionOnlyButton")
    }
    return button
}

function toggleVisible(shouldBeHidden) {
    let localDeliveryElements = document.getElementsByClassName("s-item__localDelivery");
    let hideCollectionOnlyButton = createOrGetButton();

    for (let i = 0; i < localDeliveryElements.length; i++) {
        if (localDeliveryElements[i].offsetParent && !localDeliveryElements[i].classList.contains("s-item__dynamic")) {
            localDeliveryElements[i].offsetParent.hidden = hidden;
        } else if (localDeliveryElements[i].classList.contains("s-item__dynamic")) {
            localDeliveryElements[i].parentElement.parentElement.parentElement.parentElement.parentElement.hidden = hidden;
        }
    }

    if (hideCollectionOnlyButton.children[0]) hideCollectionOnlyButton.removeChild(hideCollectionOnlyButton.children[0]);

    let title = document.createElement('h2');
    title.className = "srp-format-tabs-h2"
    let text = document.createTextNode("Hide Collection-Only")
    title.appendChild(text)

    if (shouldBeHidden) {
        hideCollectionOnlyButton.className = "fake-tabs__item btn fake-tabs__item--current"
        hideCollectionOnlyButton.appendChild(title)
    } else {
        hideCollectionOnlyButton.className = "fake-tabs__item btn"
        let link = document.createElement("a");
        link.href = "#"
        link.appendChild(title);
        hideCollectionOnlyButton.appendChild(link)
        
    }
}
