/* global chrome browser MutationObserver */

const c = {
  childClassName: 's-item__localDelivery',
  itemParentClassName: '.s-item',
  hideCollectionOnlyActiveClass: 'fake-tabs__item--current',
  hideCollectionOnlyButtonId: 'hideCollectionOnlyButton',
  ebayConfigTabsId: '.fake-tabs__items',
  ebayConfigTabsButtonClass: 'fake-tabs__item btn',
  ebayConfigTabsButtonTitleClass: 'srp-format-tabs-h2',
  hideCollectionOnlyButtonTitle: getText('hideCollectionOnlyButtonTitle', 'Hide Collection-Only')
};

function getText (name, defaultString) {
  if (typeof chrome !== 'undefined') {
    return chrome.i18n.getMessage(name);
  } else if (typeof browser !== 'undefined') {
    return browser.i18n.getMessage(name);
  } else {
    console.error("Unknown browser, can't get translations. Returning default value: " + defaultString);
    return defaultString;
  }
}

function setStorage (hidden) {
  // Chrome
  if (typeof chrome !== 'undefined') {
    chrome.storage.sync.set({ hidden: hidden });
  // Firefox
  } else if (typeof browser !== 'undefined') {
    browser.storage.sync.set({ hidden: hidden });
  } else {
    console.error(`${getText('extensionName', 'Hide Collection-Only Button for eBay')}: ${getText('noBrowserStorageFound', 'No browser storage found')}, ${getText('notSavingState', 'not saving state')}: ${hidden}`);
  }
}

function getStorage () {
  return new Promise(resolve => {
    // Chrome
    if (typeof chrome !== 'undefined') {
      chrome.storage.sync.get(['hidden'], (result) => {
        resolve(result?.hidden);
      });
    // Firefox (Which is async)
    } else if (typeof browser !== 'undefined') {
      browser.storage.sync.get('hidden').then(result => {
        resolve(result?.hidden);
      });
    } else {
      console.error(`${getText('extensionName', 'Hide Collection-Only Button for eBay')}: ${getText('noBrowserStorageFound', 'No browser storage found')}, ${getText('returningDefaultState', 'returning default state')}: false`);
      resolve(false);
    }
  });
}

function start () {
  getStorage().then(hidden => {
    if (typeof hidden === 'undefined') {
      hidden = false;
      setStorage(hidden);
    }
    toggleVisible(hidden);
  });
}

async function toggleVisible (shouldBeHidden) {
  const hideCollectionOnlyButton = await createOrGetButton(shouldBeHidden);

  toggleAlreadyLoadedElements(shouldBeHidden);
  handleLoadingElements(shouldBeHidden);

  if (shouldBeHidden) {
    hideCollectionOnlyButton.classList.add(c.hideCollectionOnlyActiveClass);
  } else {
    hideCollectionOnlyButton.classList.remove(c.hideCollectionOnlyActiveClass);
  }
}

function createOrGetButton (shouldBeHidden) {
  return new Promise(resolve => {
    const button = document.getElementById(c.hideCollectionOnlyButtonId);
    if (!button) {
      waitForElm(c.ebayConfigTabsId).then((tabs) => {
        const item = document.createElement('li');
        item.className = c.ebayConfigTabsButtonClass;
        item.id = c.hideCollectionOnlyButtonId;

        const title = document.createElement('h2');
        title.className = c.ebayConfigTabsButtonTitleClass;
        const text = document.createTextNode(c.hideCollectionOnlyButtonTitle);
        title.appendChild(text);

        item.appendChild(title);

        item.onclick = function () {
          shouldBeHidden = !shouldBeHidden;
          setStorage(shouldBeHidden);
          toggleVisible(shouldBeHidden);
        };
        resolve(tabs.appendChild(item));
      });
    } else {
      resolve(button);
    }
  });
}

function waitForBody () {
  return new Promise((resolve) => {
    if (!document.body) {
      const observer = new MutationObserver(() => {
        if (document.body) {
          observer.disconnect();
          resolve();
        }
      });
      observer.observe(document.documentElement, { childList: true });
    } else {
      resolve();
    }
  });
}

function waitForElm (selector) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    waitForBody().then(() => {
      const observer = new MutationObserver((mutations) => {
        if (document.querySelector(selector)) {
          resolve(document.querySelector(selector));
          observer.disconnect();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  });
}

function toggleAlreadyLoadedElements (hidden) {
  const localDeliveryElements = document.getElementsByClassName(c.childClassName);
  for (const i of localDeliveryElements) {
    switchGivenElementsParent(i, hidden);
  }
}

function switchGivenElementsParent (childElement, hidden) {
  let element;
  if (childElement.offsetParent && !childElement.classList.contains('s-item__dynamic')) {
    element = childElement.offsetParent;
  } else if (childElement.classList.contains('s-item__dynamic')) {
    element = childElement.closest(c.itemParentClassName);
  }
  if (element) element.hidden = typeof hidden === 'undefined' ? !element.hidden : hidden;
}

function handleLoadingElements (hidden) {
  waitForBody().then(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation?.target?.className?.includes && mutation?.target?.className?.includes(c.childClassName)) {
          switchGivenElementsParent(mutation.target, hidden);
        }
      });
      if (document.readyState === 'complete') {
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}

start();
