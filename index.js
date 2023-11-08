const commonConfig = {
  debug: false,
  extensionName: getText('hideCollectionOnlyButtonTitle', 'Hide Collection-Only'),
  itemParentClassName: '.s-item',
  hideCollectionOnlyActiveClass: 'fake-tabs__item--current',
  hideCollectionOnlyButtonId: 'hideCollectionOnlyButton',
  ebayConfigTabsId: '.fake-tabs__items',
  ebayConfigTabsButtonClass: 'fake-tabs__item btn',
  ebayConfigTabsButtonTitleClass: 'srp-format-tabs-h2',
  hideCollectionOnlyButtonTitle: getText('hideCollectionOnlyButtonTitle', 'Hide Collection-Only')
}

// If the pathname begins with /b/ then it's a category/browse page
// If the pathname begins with /sch/ then it's a search page
// If it's anything else, we'll use the same args as if it were a search page, just in case
const pathPrefixConfigs = {
  '/sch/': {
    childClassName: 's-item__localDelivery',
    filter: (matches) => matches,
    ...commonConfig
  },
  '/b/': {
    childClassName: 's-item__delivery-options s-item__deliveryOptions',
    filter: makeInnerTextFilter('collectionInPerson', 'Collection in person'),
    ...commonConfig
  }
}

function log(...args) {
  if (commonConfig.debug) {
    console.log(`[${commonConfig.extensionName}]`, ...args)
  }
}

function makeInnerTextFilter(textLanguageString, defaultString) {
  const filterString = getText(textLanguageString, defaultString)
  log("Creating filter for text: ", filterString)
  return elms => {
    const perElmFilter = elm => elm?.innerText?.trim() === filterString
    // HTMLCollections/nodelists/etc have an iterator, so we can use that to check if it's (basically) an array or a single element
    // If it's an array-like, we'll use Array.from to convert it to an array and then filter it
    if (typeof elms[Symbol.iterator] === 'function') {
      log("Passed elms", elms, "is an array-like, filtering it to find elements with innertext:", filterString)
      return Array.from(elms).filter(perElmFilter)
    } else {
      // If it's one element, we just return a true/false
      log("Passed elms", elms, "is a single element, returning true/false if it matches:", filterString)
      return perElmFilter(elms)
    }
  }
}

function getConfigForPageType() {
  const urlPath = window.location.pathname
  for (const [key, value] of Object.entries(pathPrefixConfigs)) {
    if (urlPath.startsWith(key)) {
      log("Found config for page type: " + key)
      return value
    }
  }
  log("No config found for page type, returning default config")
  return pathPrefixConfigs['/sch/']
}

function getText (name, defaultString) {
  if (typeof chrome !== 'undefined') {
    return chrome.i18n.getMessage(name)
  } else if (typeof browser !== 'undefined') {
    return browser.i18n.getMessage(name)
  } else {
    console.error("Unknown browser, can't get translations. Returning default value: " + defaultString)
    return defaultString
  }
}

function setStorage (hidden) {
  // Chrome
  if (typeof chrome !== 'undefined') {
    chrome.storage.sync.set({ hidden })
  // Firefox
  } else if (typeof browser !== 'undefined') {
    browser.storage.sync.set({ hidden })
  } else {
    console.error(`${getText('extensionName', 'Hide Collection-Only Button for eBay')}: ${getText('noBrowserStorageFound', 'No browser storage found')}, ${getText('notSavingState', 'not saving state')}: ${hidden}`)
  }
}

function getStorage () {
  return new Promise(resolve => {
    const callback = (result) => {
      if (result.hidden == null) {
        log("User setting not found, defaulting to false")
        setStorage(false)
        resolve(false)
      } else {
        log("User setting has collection-only results hidden:", result.hidden)
        resolve(result.hidden)
      }
    }
    // Chrome
    if (typeof chrome !== 'undefined') {
      chrome.storage.sync.get(['hidden'], callback)
    // Firefox (Which is async)
    } else if (typeof browser !== 'undefined') {
      browser.storage.sync.get('hidden').then(callback)
    } else {
      console.error(`${getText('extensionName', 'Hide Collection-Only Button for eBay')}: ${getText('noBrowserStorageFound', 'No browser storage found')}, ${getText('returningDefaultState', 'returning default state')}: false`)
      resolve(false)
    }
  })
}

function start () {
  getStorage().then(hidden => {
    toggleVisible(hidden, getConfigForPageType())
  })
}

async function toggleVisible (shouldBeHidden, c) {
  const hideCollectionOnlyButton = await createOrGetButton(shouldBeHidden, c)

  toggleAlreadyLoadedElements(shouldBeHidden, c)
  handleLoadingElements(shouldBeHidden, c)

  if (shouldBeHidden) {
    hideCollectionOnlyButton.classList.add(c.hideCollectionOnlyActiveClass)
  } else {
    hideCollectionOnlyButton.classList.remove(c.hideCollectionOnlyActiveClass)
  }
}

function createOrGetButton (shouldBeHidden, c) {
  return new Promise(resolve => {
    const button = document.getElementById(c.hideCollectionOnlyButtonId)
    if (!button) {
      log("Didn't find button, creating it")
      waitForElm(c.ebayConfigTabsId).then((tabs) => {
        log("Found tabs:", tabs)
        const item = document.createElement('li')
        item.className = c.ebayConfigTabsButtonClass
        item.id = c.hideCollectionOnlyButtonId

        const title = document.createElement('h2')
        title.className = c.ebayConfigTabsButtonTitleClass
        const text = document.createTextNode(c.hideCollectionOnlyButtonTitle)
        title.appendChild(text)

        item.appendChild(title)

        item.onclick = function () {
          shouldBeHidden = !shouldBeHidden
          setStorage(shouldBeHidden)
          toggleVisible(shouldBeHidden, c)
        }
        log("New button:", item)
        tabs.appendChild(item)
        resolve(item)
      })
    } else {
      log("Found button:", button)
      resolve(button)
    }
  })
}

function waitForBody () {
  return new Promise((resolve) => {
    if (!document.body) {
      const observer = new MutationObserver(() => {
        if (document.body) {
          observer.disconnect()
          resolve(true)
        }
      })
      observer.observe(document.documentElement, { childList: true })
    } else {
      resolve(true)
    }
  })
}

function waitForElm (selector) {
  return new Promise((resolve) => {
    const currentElm = document.querySelector(selector)
    if (currentElm) {
      log("Elm already loaded:", currentElm)
      return resolve(currentElm)
    }

    waitForBody().then(() => {
      log("Elm with selector", selector, "wasn't found, setting up watcher...")
      const observer = new MutationObserver((mutations) => {
        // mutations is an Array of MutationRecords
        // MutationRecords.addedNodes is a NodeList of all the added nodes
        const elm = mutations.map(mutation => {
          return Array.from(mutation?.addedNodes).filter(addedNode => addedNode?.matches?.(selector))
        }).flat()
        if (elm.length > 0) {
          log("Found elements matching selector", selector, "in mutations", mutations, ". Returning element:", elm[0])
          resolve(elm[0])
          observer.disconnect()
        }
      })

      observer.observe(document.body, {
        childList: true,
        subtree: true
      })
    })
  })
}

function toggleAlreadyLoadedElements (hidden, c) {
  log("Toggling already loaded elements by name:", c.childClassName)
  const localDeliveryElements = c.filter(document.getElementsByClassName(c.childClassName))
  for (const i of localDeliveryElements) {
    switchGivenElementsParent(i, hidden, c.itemParentClassName)
  }
}

function switchGivenElementsParent (childElement, hidden, itemParentClassName) {
  let parent = childElement.closest(itemParentClassName)
  if (itemParentClassName && parent) {
    log("Setting hidden status of parent", parent, "for element", childElement, "from", parent.hidden, "to", hidden)
    parent.hidden = hidden
    return
  } else {
    log("Couldn't find parent for element", childElement, ". Hiding element instead.")
    childElement.hidden = hidden
  }
}

function handleLoadingElements (hidden, c) {
  waitForBody().then(() => {
    log("Body loaded, but document might not be ready yet, setting up watcher for new elements...")
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation?.target?.className?.includes && mutation?.target?.className?.includes(c.childClassName) && c.filter(mutation.target)) {
          switchGivenElementsParent(mutation.target, hidden)
        }
      })
      if (document.readyState === 'complete') {
        observer.disconnect()
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  })
}

start()
