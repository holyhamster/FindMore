import DOMSearcher from './domSearcher.js';
import SearchState from './modules/searchState.js';

const matchUpdateEventName = "TF-matches-update";
class SearchBar
{
    id;

    mainDiv;
    state;
    domSearcher;

    onClose;
    onSearchChange;

    color;

    selectedIndex;
    intersectionObserver;

    iframesCSSMap = new Map();

    constructor(_id, _state, _order)
    {
        this.id = _id;
        this.state = _state;

        this.classNames = getCSSClassSchema(_id);


        this.color = _state.color;

        this.onClose = new Event("tf-bar-closed");
        this.onClose.id = this.id;

        this.onSearchChange = new Event("tf-search-changed");
        this.onSearchChange.id = this.id;

        this.cssString =
            `.TFC${this.id} { position: absolute; }` +
            `.TFCR${this.id} { position: relative; }` +
            `.TFH${this.id} { position: absolute; background-color: ${this.color};`+
                ` opacity: 0.8; z-index: 147483647;}` +
            `.TFHS${this.id} { border: 5px solid ${invertHex(this.color)}; padding: 0px;}`

        this.highlightCSS = new CSSStyleSheet();
        this.highlightCSS.replaceSync(this.cssString);

        document.adoptedStyleSheets = [...document.adoptedStyleSheets, this.highlightCSS];

        this.constructHtml();
        this.setPosition(_order);

        if (this.state && this.state.searchString != "")
            this.startSearcher(this.state, this.id);
    }

    setPosition(_order)
    {
        this.mainDiv.style.top = (_order * 70) + 10 + "px";
    }

    //#region HTML
    constructHtml()
    {
        let topFlex = document.createElement("div");
        topFlex.setAttribute("class", "TFSearchBarRow");
        topFlex.innerHTML = `
            <input class="searchInput" value="${this.state.searchString}" placeholder="Find in page">
            <span class="matchesLabel">0/0</span>
            <button class="refreshButton">R</button>
            <button class="downButton">v</button>
            <button class="upButton">^</button>
            <button class="closeButton">x</button>`;

        topFlex.querySelector(`.searchInput`)
            .addEventListener("input", function (_args)
            {
                if (!_args?.target)
                    return;
                _args.target.value = formatIncomingString(_args.target.value);
                
                let stateChange = _args.target.value != this.state.searchString;
                this.state.searchString = _args.target.value;
                this.restartSearch(this.state, this.id, stateChange);
            }.bind(this));

        topFlex.querySelector(`.searchInput`)
            .addEventListener("keydown", function (_args)
            {
                if (_args.key === "Enter")
                    this.nextMatch()
            }.bind(this));

        topFlex.querySelector(`.refreshButton`)
            .addEventListener("click", function ()
            {
                this.restartSearch(this.state, this.id, false)
            }.bind(this));

        topFlex.querySelector(`.downButton`) 
            .addEventListener("click", function () { this.nextMatch() }.bind(this));
        topFlex.querySelector(`.upButton`)
            .addEventListener("click", function () { this.previousMatch() }.bind(this));
        topFlex.querySelector(`.closeButton`)
            .addEventListener("click", function ()
            {
                this.close();
                document.dispatchEvent(this.onClose);
            }.bind(this));

        let botFlex = document.createElement("div");
        botFlex.setAttribute("class", "TFSearchBarRow");
        botFlex.innerHTML = 
                `<input type="checkbox" class="caseCheck" id="caseCheck${this.id}"` +
                    `${this.state.caseSensetive ? "cached" : ""} name="caseCheck${this.id}">`+
                `<label for="caseCheck${this.id}">match case</label>` +
                `<input type="checkbox" class="wordCheck" id="wordCheck${this.id}"` +
                    `${this.state.wholeWord ? "cached" : ""} name="wordCheck{this.id}">` +
                `<label for="wordCheck${this.id}">whole word</label>` +
                `<button class="pinButton"> ${this.state.pinned ? "PINNED" : "PIN"}`+
                `</button>`;

        botFlex.querySelector(`.caseCheck`).addEventListener("input", function (_args)
            {
                let stateChange = this.state.caseSensitive != _args.target.checked;
                this.state.caseSensitive = _args.target.checked;
                this.restartSearch(this.state, this.id, stateChange);
            }.bind(this));

        botFlex.querySelector(`.wordCheck`).addEventListener("input", function (_args)
        {
            let stateChange = this.state.wholeWord != _args.target.checked;
            this.state.wholeWord = _args.target.checked;
            this.restartSearch(this.state, this.id, stateChange);
        }.bind(this));

        botFlex.querySelector(`.pinButton`).addEventListener("click", function (_args)
            {
                if (!this.pinButton)
                    this.pinButton = this.mainDiv.querySelector(`.pinButton`);

                this.state.pinned = !this.state.pinned;
                this.pinButton.textContent = (this.state.pinned ? "PINNED" : "PIN");
                document.dispatchEvent(this.onSearchChange);
        }.bind(this));

        this.mainDiv = this.constructMainDiv();

        this.mainDiv.appendChild(topFlex);
        this.mainDiv.appendChild(botFlex);

        let shadowroot = this.getShadowRoot();
        shadowroot.appendChild(this.mainDiv);

        topFlex.querySelector(`.searchInput`).focus();
    }

    getShadowRoot()
    {
        let shadowDiv = document.getElementById("TFShadowRoot");
        if (!shadowDiv)
        {
            shadowDiv = document.createElement("div");
            shadowDiv.setAttribute("id", "TFShadowRoot");
            document.body.appendChild(shadowDiv);
        }

        if (SearchBar.shadowRoot)
            return SearchBar.shadowRoot;

        SearchBar.shadowRoot = shadowDiv.attachShadow({ mode: "closed" });
        SearchBar.shadowRoot.innerHTML = "<style>" +
            //":host, :host * {}" +
            ":host, div {all: initial; font-family: Verdana, sans-serif; webkit-touch-callout: none;} " +
            ".TFSearchBar {position: fixed; display: flex; flex-direction: column; " +
                "justify-content: space-evenly; border-radius: 12px; opacity: 0.9;} " +
            ".TFSearchBarRow {display: flex; justify-content:space-between; } " +
            "button { border-radius: 3px;} " +
            ".closeButton {margin-left: auto;} " +
            ".downButton {margin-left: auto; } " +
            ".upButton {margin-left: auto; margin-right: 5px; } " +
            ".refreshButton {margin-left: auto; margin-right: 5px; }" +
            ".searchButton {margin-right: auto; } " +
            ".matchesLabel {margin-right: auto; min-width:100px; } " +
            ".wordLabel {margin-right: auto;} " +
            ".pinButton {margin-left: auto;} " +
            "</style>";
        return SearchBar.shadowRoot;
    }

    constructMainDiv()
    {
        let main = document.createElement("div");
        main.setAttribute("class", `TFSearchBar`);
        main.setAttribute("id", `TFSearchBar${this.id}`);
        main.style = `  
              top: 10px; right: 10px; min-width: 300px; padding: 10px; z-index: 147483647;
              background-color: ${this.color};`

        return main;
    }

    //#endregion

    close()
    {
        this.stopSearcher(this.id);

        if (document.adoptedStyleSheets.includes(this.highlightCSS))
        {
            let sheets = [];
            for (let i = 0; i < document.adoptedStyleSheets.length; i++)
                if (document.adoptedStyleSheets[i] != this.highlightCSS)
                    sheets.push(document.adoptedStyleSheets[i])

            document.adoptedStyleSheets = sheets;
        }
        this.iframesCSSMap.forEach(function (_css, _frameSheets)
        {
            let index = _frameSheets.indexOf(_css);
            if (index >= 0)
                _frameSheets.splice(index, 1);
        });

        this.mainDiv.remove();
    }

    restartSearch(_state, _id, _sendEvent)
    {
        this.selectedIndex = null;
        this.updateLabels();

        this.startSearcher(_state, _id);       

        if (_sendEvent)
            document.dispatchEvent(this.onSearchChange);
    }

    previousMatch()
    {
        if (!this.domSearcher || this.domSearcher.getMatches().length == 0)
            return;

        if (this.selectedIndex == null)
            this.selectedIndex = 0;
        else
            this.selectedIndex -= 1;

        if (this.selectedIndex < 0)
            this.selectedIndex = this.domSearcher.getMatches().length - 1;

        this.domSearcher.selectHighlight(this.selectedIndex);
        this.updateLabels()
    }

    nextMatch()
    {
        if (!this.domSearcher || this.domSearcher.getMatches().length == 0)
            return;

        if (this.selectedIndex == null)
        {
            this.selectedIndex = 0;
        }
        else
        {
            this.selectedIndex += 1;
        }

        if (this.selectedIndex >= this.domSearcher.getMatches().length)
        {
            this.selectedIndex = 0;
        }

        this.domSearcher.selectHighlight(this.selectedIndex);
        this.updateLabels()
    }

    startSearcher(_state, _id)
    {
        this.stopSearcher(_id);
        
        if (_state.searchString != "")
            this.domSearcher = new DOMSearcher(_id,_state.searchString, _state.getRegex(false),
                this.getWalk());
        document.addEventListener(
            `${matchUpdateEventName}${_id}`, this.updateLabels.bind(this));
        this.updateLabels();
    }

    stopSearcher(_id)
    {
        if (this.domSearcher)
        {
            this.domSearcher.interrupt();
            this.domSearcher = null;
            removeDOMClass(document, `TFC${_id}`);
            removeDOMClass(document, `TFCR${_id}`);

            this.iframesCSSMap.forEach(function (_sheets, _iframe)
            {
                removeDOMClass(_iframe.contentDocument, `TFC${_id}`);
                removeDOMClass(_iframe.contentDocument, `TFCR${_id}`);
                _sheets.remove();
            }.bind(this));
            this.iframesCSSMap.clear();

            this.selectedIndex = null;
            document.removeEventListener(
                `${matchUpdateEventName}${_id}`, this.updateLabels);
        }
    }

    updateLabels()
    {
        if (!this.progressLabel)
            this.progressLabel = this.mainDiv.querySelector(`.matchesLabel`);

        if (this.selectedIndex == null && this.domSearcher?.getMatches().length > 0)
        {
            this.selectedIndex = 0;
            this.domSearcher.selectHighlight(this.selectedIndex);
        }

        const labelText = (this.selectedIndex == null ? '0' : (this.selectedIndex + 1)) + `/` +
            (this.domSearcher == null ? 0 : this.domSearcher.getMatches().length);
        this.progressLabel.textContent = labelText;

    }

    getWalk()
    {
        let treeWalker = document.createTreeWalker(
            document.body, NodeFilter.SHOW_ALL, treeWalkerCondition);
        treeWalker.cssString = this.cssString;
        treeWalker.que = [treeWalker];
        treeWalker.map = this.iframesCSSMap;

        treeWalker.nextNodePlus = function ()
        {
            if (this.que.length == 0)
                return null;

            let nextNode = this.que.slice(-1)[0].nextNode();

            if (!nextNode)
            {
                this.que.pop();
                //console.log(`surfacing back to ${this.que.length}-level frame`);
                return this.nextNodePlus();
            }

            if (nextNode.nodeName.toUpperCase() == 'IFRAME' &&
                nextNode.contentDocument)
            {
                let iframeDoc = nextNode.contentDocument;
                let iframeWalker = iframeDoc.createTreeWalker(
                    iframeDoc.body, NodeFilter.SHOW_ALL, treeWalkerCondition);
                addCSSToIFrame(nextNode, this.cssString, this.map);
                this.que.push(iframeWalker);
                //console.log(`diving deeper into ${this.que.length}-level frame`);
                return this.nextNodePlus();
            }

            return nextNode;
        };
        return treeWalker;
    }
}

const treeWalkerCondition = {
    acceptNode: (node) =>
    {
        if (node.nodeName.toUpperCase() == "IFRAME")
            return NodeFilter.FILTER_ACCEPT;

        if (node.nodeName.toUpperCase() == "STYLE" ||
            node.nodeName.toUpperCase() == "SCRIPT")
            return NodeFilter.FILTER_REJECT;

        if (node.nodeType == Node.ELEMENT_NODE)
        {
            let classes = node.id.toString().split(/\s+/);
            let NODE_IS_SEARCHBAR_SHADOWROOT = classes.includes(`TFShadowRoot`);
            if (NODE_IS_SEARCHBAR_SHADOWROOT)
                return NodeFilter.FILTER_REJECT;
        }

        if (node.nodeName.toUpperCase() == "#TEXT" && node.textContent)
            return NodeFilter.FILTER_ACCEPT;

        return NodeFilter.FILTER_SKIP;
    }
};

function removeDOMClass(_document, _className)
{
    if (!_document)
        return;

    let highlights = _document.querySelectorAll(`.${_className}`);

    for (let i = 0; i < highlights.length; i++)
    {
        highlights[i].remove();
    }
}

function formatIncomingString(_string)
{
    if (!_string)
        return "";
    if (_string.length > 100)
        _string = _string.substring(0, 100);
    return _string;
}
function addCSSToIFrame(_iframe, _cssString, _iframeToStylesMap)
{
    let existingStyle = _iframeToStylesMap.get(_iframe);
    if (!existingStyle)
    {
        existingStyle = _iframe.contentDocument.createElement("style");
        existingStyle.setAttribute("class", "TFIframeStyle");
        existingStyle.innerHTML = _cssString;
        _iframeToStylesMap.set(_iframe, existingStyle)
    }

    if (existingStyle.parentNode != _iframe.contentDocument.head)
    {
        _iframe.contentDocument.head.appendChild(existingStyle);
    }
}

function invertHex(_hex)
{
    let color = _hex + "";
    color = color.substring(1); // remove #
    color = parseInt(color, 16); // convert to integer
    color = 0xFFFFFF ^ color; // invert three bytes
    color = color.toString(16); // convert to hex
    color = ("000000" + color).slice(-6); // pad with leading zeros
    color = "#" + color; // prepend #
    return color;
}

function getCSSClassSchema(_id)
{
    let schema = new Object();

    schema.hlContainer = `TFC${_id}`;
    schema.highlight = `TFH${_id}`;
    schema.highlightSelected = `TFHS${_id}`;

    return schema;
}

function copyCSSHighlight(_css)
{
    let result = new CSSStyleSheet();
    Array.from(_css.cssRules).forEach(function (_rule) { result.replaceSync(_rule.cssText); });
    return result;
}
export default SearchBar;