let hidden = false;
chrome.storage.sync.get(["hidden"], result => {
    console.log(`Hidden is currently ${JSON.stringify(result)}`)
    if (typeof result.hidden === "undefined") {
        chrome.storage.sync.set({hidden: hidden}, () => {
            console.log(`Set hidden to ${hidden}`)
        });
    } else {
        hidden = result.hidden;
    }

    let tabs = document.getElementsByClassName("fake-tabs__items")[0];
    let item = document.createElement('li');
    item.className = "fake-tabs__item btn"
    item.id = "hideCollectionOnlyButton";
    let link = document.createElement("a");
    link.href = "#"
    link.onclick = function() {
        hidden = !hidden;
        chrome.storage.sync.set({hidden: hidden}, () => {
            console.log(`Set hidden to ${hidden}`)
        })
        toggleVisible(hidden)
    }
    let title = document.createElement('h2');
    title.className = "srp-format-tabs-h2"
    let text = document.createTextNode("Hide Collection-Only")

    title.appendChild(text);
    link.appendChild(title);
    item.appendChild(link);
    tabs.appendChild(item);

    if (hidden) toggleVisible(hidden);

});

function toggleVisible(shouldBeHidden) {
    let localDeliveryElements = document.getElementsByClassName("s-item__localDelivery");
    for (let i = 0; i < localDeliveryElements.length; i++) {
        if (localDeliveryElements[i].offsetParent && !localDeliveryElements[i].classList.contains("s-item__dynamic")) {
            localDeliveryElements[i].offsetParent.hidden = hidden;
        } else if (localDeliveryElements[i].classList.contains("s-item__dynamic")) {
            localDeliveryElements[i].parentElement.parentElement.parentElement.parentElement.parentElement.hidden = hidden;
        }
        if (hidden) {
            document.getElementById("hideCollectionOnlyButton").className = "fake-tabs__item btn fake-tabs__item--current"
        } else {
            document.getElementById("hideCollectionOnlyButton").className = "fake-tabs__item btn"
        }
    }
}
