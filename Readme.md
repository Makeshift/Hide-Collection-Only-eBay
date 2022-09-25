# Hide Collection Only eBay Chrome Extension

This is a simple extension that adds a 'Hide Collection-Only' button to eBay search results.

This toggle persists through page loads and can be dynamically turned on and off.

### Permissions

This extension uses the `storage` permission to store the state of the toggle. This permission is required, as [content scripts cannot access most `chrome` API's](https://stackoverflow.com/a/18195744)(to check if the permission was given) and I didn't want to overcomplicate this very simple extension.

Also, [DeclarativeAction](https://developer.chrome.com/extensions/declarativeAction) isn't available in content scripts either, so the best we can do is MutationObservers :(

### Images

#### Disabled

![button-off](./button-off.PNG)

#### Enabled

![button-on](./button-on.PNG)
