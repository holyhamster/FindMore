![promogithub](https://user-images.githubusercontent.com/27297124/227906313-a08a6ca4-a8a6-4c96-b913-053392bf4d77.png)


FindMore is a pure javascript extension for the Chrome browser that lets you create multiple panels to help you with research.
Get it from the Chrome store(link) or load it yourself from the source code.

<b>Features:</b>

* Start multiple independent queries
* Customize layout and session persistence
* Save and load your entire setup to move it between tabs and sessions
* Optimized search and render algorithms
* Colorblind-friendly palette
* No data leaves your browser

![screenshot3](https://user-images.githubusercontent.com/27297124/227904056-0afb85d0-9e2e-4db8-8d62-4cbc09df65de.png)


<b>Hotkeys: </b>

- CTRL + Q -- open a new panel
- ALT + Q -- cycle focus between panels (open a new one if none exists)
- CTRL + Y -- save all panels from the current page
- CTRL + B -- load saved setup into the page

<b>Mechanism: </b>

Background.js is run as a service worker to listen to hotkey commands, messages from popup page and active tab.
Individual searches exist within the page javascript: Content-main.js is injected in every page and creates new Search instances on command from background script.
Search uses DomCrawler to comb through the page DOM tree and sends all matches to Highlighter, which creates colored rectangles around them. 
IntersectionObserver library is used by Highlighter to coordinate different stages of drawing process, in order to minimize reflow calls to the browser.
Popup.html with popup.js send option changes and save/load events to service worker.

<b>Known issues:</b>

While existing DOM tree elements are not altered, addition of new ones can occasionally change page layout depending on a page layout.
Some websites capture input and prevent keyboard presses from reaching search ui.
