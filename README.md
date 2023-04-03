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

<br>

![screenshot](https://user-images.githubusercontent.com/27297124/229439448-aea62c41-9e85-4b40-b96d-1cc5d7b95f15.png)

## Hotkeys:

- CTRL + Q -- open a new panel
- ALT + Q -- cycle focus between panels (open a new one if none exists)
- CTRL + Y -- save all panels from the current page
- CTRL + B -- load saved setup into the page

## Technical info:

- <a href=https://github.com/holyhamster/FindMore/blob/dev/background.js>Background.js</a> is run as a service worker to listen to hotkey commands, messages from popup and active tab.
- Individual searches exist within the page's javascript: injected <a href=https://github.com/holyhamster/FindMore/blob/dev/src/js/content-main.js>Content-main.js</a> creates new <a href=https://github.com/holyhamster/FindMore/blob/dev/src/js/search/search.js>Search</a> instances on command from the service worker.
- Search creates <a href=https://github.com/holyhamster/FindMore/blob/dev/src/js/search/panel.js>UI panel</a> and uses <a href=https://github.com/holyhamster/FindMore/blob/dev/src/js/search/domCrawling/domCrawler.js>DomCrawler</a> to comb through the page DOM tree and sends all matches to <a href=https://github.com/holyhamster/FindMore/blob/dev/src/js/search/rendering/highlighter.js>Highlighter</a>
- UI exists within a <a href=https://github.com/holyhamster/FindMore/blob/dev/src/js/search/rootNode.js>closed shadow element</a> to prevent any other script on the page from interfering
- <a href=https://github.com/holyhamster/FindMore/blob/dev/src/js/search/rendering/highlighter.js>Highlighter</a> adds html tags with colored background to matches' location
- Match nodes of the same parent are organized into the same <a href=https://github.com/holyhamster/FindMore/blob/dev/src/js/search/rendering/container.js>container</a> for better performance
- IntersectionObserver library is used to coordinate different stages of drawing process to minimize reflow calls to the browser.
