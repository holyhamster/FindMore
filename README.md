![promogithub](https://user-images.githubusercontent.com/27297124/227906313-a08a6ca4-a8a6-4c96-b913-053392bf4d77.png)


### Boost your research with FindMore, a multi-query page searching extension for Chrome browser.

## Features:

* Start multiple independent queries
* Customize layout and session persistence
* Move your setup between tabs and sessions
* Optimized searching and rendering algorithms
* Colorblind-friendly palette
* No data leaves your browser!

### Get it from <a href=https://chrome.google.com/webstore/detail/findmore/gboabaailmimjgjabafbphbgopcgfpie>Chrome store</a> or load it from the source.

![screenshot3](https://user-images.githubusercontent.com/27297124/227904056-0afb85d0-9e2e-4db8-8d62-4cbc09df65de.png)


## Hotkeys:

- CTRL + Q -- open a new panel
- ALT + Q -- cycle focus between panels (open a new one if none exists)
- CTRL + Y -- save all panels from the current page
- CTRL + B -- load saved setup into the page

## Technical info:

- Background.js is run as a service worker to listen to hotkey commands, messages from popup page and active tab.
- Individual searches exist within the page javascript: Content-main.js is injected in every page and creates new Search instances on command from the service worker.
- Search uses DomCrawler to comb through the page DOM tree and sends all matches to Highlighter
- IntersectionObserver library is used by Highlighter to coordinate different stages of drawing process to minimize reflow calls to the browser.
- Popup.html with popup.js send option changes and save/load events to service worker.
