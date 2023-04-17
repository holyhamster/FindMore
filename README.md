![promogithub](https://user-images.githubusercontent.com/27297124/227906313-a08a6ca4-a8a6-4c96-b913-053392bf4d77.png)


### Boost your research with FindMore, multi-query page searching extension for Chrome browser.

## Features:

* Start multiple independent queries
* Customize layout and session persistence
* Move your setup between tabs and sessions
* Optimized searching and rendering algorithms
* Colorblind-friendly palette
* No data leaves your browser!

### Get it from <a href=https://chrome.google.com/webstore/detail/findmore/gboabaailmimjgjabafbphbgopcgfpie>Chrome store</a> or load it from the source.

<br>

![screenshot](https://user-images.githubusercontent.com/27297124/229439448-aea62c41-9e85-4b40-b96d-1cc5d7b95f15.png)

## Hotkeys:

- CTRL + Q -- open a new panel
- ALT + Q -- cycle focus between panels (open a new one if none exists)
- CTRL + Y -- save all panels from the current page
- CTRL + B -- load saved setup into the page

## Build and load from source:

- Clone this github project (with Visual Studio or another git tool)
- "Npm install" all dependencies
- Convert Typescript into javascript files with "npm run build" (script located in /FindMore/webpack/webpack.config.js)
- Go to Chrome extensions page, press "Load unpacked" button and navigate to /FindMore/dist/

## Technical info:

- Background.ts is run as a service worker to listen to hotkey commands, messages from popup and active tab.
- Individual searches exist within the page's javascript: injected Content-main.ts creates new Search.ts instances on command from the service worker.
- Search creates a UI panel, uses DomCrawler to comb through the page's DOM tree and sends all matches to Observer.ts
- UI exists within a closed shadow element to prevent any other script on the page from interfering
- On call from IntersectionObserver, Observer creates HighlightedMatches from Matches in batches, to prevent browser redraws in-between
