import DOMSearcher from './domSearcher.js';
import Highlighter from './highlighter.js';
import ShadowrootCSS from './shadowrootCSS.js'
class SearchBar
{
    domSearcher;
    highlighter;

    selectedIndex;

    constructor(_id, _state)
    {
        this.id = _id;
        this.state = _state;

        this.onClose = new Event("tf-bar-closed");
        this.onClose.id = this.id;

        this.onSearchChange = new Event("tf-search-changed");
        this.onSearchChange.id = this.id;

        this.mainDiv = this.constructHtml(_state);
        SearchBar.getShadowRoot().appendChild(this.mainDiv);

        this.addHTMLEvents();

        if (this.state.searchString == "")
            this.mainDiv.querySelector(`.searchInput`).focus();
        else
            this.startDomSearch(this.state, this.id);
    }

    //#region HTML
    constructHtml(_state)
    {
        console.log(_state);
        const topFlex = document.createElement("div");
        topFlex.setAttribute("class", "TFSearchBarRow");
        topFlex.innerHTML = 
            `<input class="searchInput" value="${_state.searchString}" placeholder=" Find in page">
            <button class="downButton">&#x25BD</button>
            <button class="upButton">&#x25B3</button>
            <button class="refreshButton">&#x21BA</button>
            <button class="closeButton">X</button>`;

        const botFlex = document.createElement("div");
        botFlex.setAttribute("class", "TFSearchBarRow");

        botFlex.innerHTML = 
            `<span class="selectedMatch">0</span>
            <span>/</span>
            <span class="totalMatches">0</span>
            <input type="checkbox" class="caseCheck" id="caseCheck${this.id}" name="caseCheck${this.id}"
                ${_state.caseSensitive ? "checked" : ""}>
            <label for="caseCheck${this.id}">CasE</label>
            <input type="checkbox" class="wordCheck" id="wordCheck${this.id}" name="wordCheck${this.id}"
                ${this.state.wholeWord ? "checked" : ""}>
            <label for="wordCheck${this.id}" class="wordLabel">_phrase_</label>
            <button class="colorButton button-28">&#x25D1</button>
            <button class="pinButton"> ${_state.pinned ? "\u{25A3}" : "\u{25A2}"}</button>`;

        const mainDiv = document.createElement("div");
        mainDiv.setAttribute("class", `TFSearchBar${_state.pinned? " pinned": ""}`);
        mainDiv.setAttribute("id", `TFSearchBar${this.id}`);
        mainDiv.style.backgroundColor = _state.primaryColor;
        mainDiv.style.setProperty("--primary-color", _state.primaryColor);
        mainDiv.style.setProperty("--secondary-color", _state.secondaryColor);
        mainDiv.appendChild(topFlex);
        mainDiv.appendChild(botFlex);

        topFlex.querySelector(`.searchInput`).focus();

        return mainDiv;
    }

    addHTMLEvents()
    {
        this.mainDiv.addEventListener("tf-matches-update",
            function (_args) { this.updateLabels(); }.bind(this));

        this.mainDiv.querySelector(`.searchInput`).addEventListener("input", function (_args)
        {
            if (!_args?.target)
                return;
            _args.target.value = formatIncomingString(_args.target.value);

            let stateChange = _args.target.value != this.state.searchString;
            this.state.searchString = _args.target.value;
            this.restartSearch(this.state, this.id, stateChange);
        }.bind(this));

        this.mainDiv.querySelector(`.searchInput`).addEventListener("keydown", function (_args)
        {
            if (_args.key === "Enter")
                this.updateLabels(1)
        }.bind(this));

        this.mainDiv.querySelector(`.refreshButton`).addEventListener("click", function ()
        {
            this.restartSearch(this.state, this.id, false)
        }.bind(this));

        this.mainDiv.querySelector(`.downButton`).addEventListener("click", function ()
        {
            this.updateLabels(1)
        }.bind(this));

        this.mainDiv.querySelector(`.upButton`).addEventListener("click", function ()
        {
            this.updateLabels(-1)
        }.bind(this));

        this.mainDiv.querySelector(`.closeButton`).addEventListener("click", function ()
        {
            this.close();
            document.dispatchEvent(this.onClose);
        }.bind(this));

        this.mainDiv.querySelector(`.caseCheck`).addEventListener("input", function (_args)
        {
            let stateChange = this.state.caseSensitive != _args.target.checked;
            this.state.caseSensitive = _args.target.checked;
            this.restartSearch(this.state, this.id, stateChange);
        }.bind(this));

        this.mainDiv.querySelector(`.wordCheck`).addEventListener("input", function (_args)
        {
            let stateChange = this.state.wholeWord != _args.target.checked;
            this.state.wholeWord = _args.target.checked;
            this.restartSearch(this.state, this.id, stateChange);
        }.bind(this));

        this.mainDiv.querySelector(`.pinButton`).addEventListener("click", function (_args)
        {
            if (!this.pinButton)
                this.pinButton = this.mainDiv.querySelector(`.pinButton`);

            this.state.pinned = !this.state.pinned;
            if (this.state.pinned)
                this.mainDiv.classList.add('pinned');
            else
                this.mainDiv.classList.remove('pinned');
            this.pinButton.textContent = (this.state.pinned ? "\u{25A3}" : "\u{25A2}");
            document.dispatchEvent(this.onSearchChange);
        }.bind(this));
    }

    static getShadowRoot()
    {
        if (SearchBar.shadowRoot)
            return SearchBar.shadowRoot;

        let shadowHolder = document.getElementById("TFShadowRoot");
        if (!shadowHolder)
        {
            shadowHolder = document.createElement("div");
            shadowHolder.setAttribute("id", "TFShadowRoot");
            document.body.appendChild(shadowHolder);
        }

        SearchBar.shadowRoot = document.createElement("div");
        SearchBar.shadowRoot.setAttribute("id", "TFBarsContainer");

        let cssReset = document.createElement("div");
        cssReset.style = "all: initial";
        cssReset.innerHTML = `<style>${ShadowrootCSS}</style>`;
        cssReset.appendChild(SearchBar.shadowRoot);

        let shadow = shadowHolder.attachShadow({ mode: "closed" });
        shadow.appendChild(cssReset);

        return SearchBar.shadowRoot;
    }

    static setOptions(_startLeft, _startTop, _horizontal)
    {
        const style = SearchBar.getShadowRoot().style;

        style.top = _startTop ? "0px" : "";
        style.bottom = _startTop ? "" : "0px";
        style.left = _startLeft ? "0px" : "";
        style.right = _startLeft ? "" : "0px";

        if (_horizontal)
        {
            style.flexDirection = _startLeft ? "row" : "row-reverse";
            style.flexWrap = _startTop ? "wrap" : "wrap-reverse";
        }
        else
        {
            style.flexDirection = _startTop ? "column" : "column-reverse";
            style.flexWrap = _startLeft ? "wrap" : "wrap-reverse";
        }
    }

    constructMainDiv()
    {
       
        return main;
    }
    //#endregion

    close()
    {
        this.clearPreviousSearch(this.id);

        if (document.adoptedStyleSheets.includes(this.highlightCSS))
        {
            let sheets = [];
            for (let i = 0; i < document.adoptedStyleSheets.length; i++)
                if (document.adoptedStyleSheets[i] != this.highlightCSS)
                    sheets.push(document.adoptedStyleSheets[i])

            document.adoptedStyleSheets = sheets;
        }

        this.mainDiv.remove();
    }

    restartSearch(_state, _id, _sendEvent)
    {
        this.selectedIndex = null;
        this.updateLabels();

        this.startDomSearch(_state, _id);       

        if (_sendEvent)
            document.dispatchEvent(this.onSearchChange);
    }

    startDomSearch(_state, _id)
    {
        this.clearPreviousSearch(_id);
        
        if (_state.searchString != "")
        {
            this.highlighter = new Highlighter(_id, this.mainDiv,
                _state.primaryColor, _state.tetriaryColor);

            this.domSearcher = new DOMSearcher(_id,
                _state.searchString, _state.getRegex(false),
                this.highlighter.getIFrameEvent(), this.highlighter);
        }
        this.updateLabels();
    }

    clearPreviousSearch(_id)
    {
        if (!this.domSearcher)
            return;

        this.domSearcher.interrupt();
        this.domSearcher = null;

        this.highlighter.clearAll();

        this.selectedIndex = null;
    }

    updateLabels(_indexChange)
    {
        const matchesLength = this.domSearcher?.getCount() || 0;

        const oldValue = this.selectedIndex;

        if (matchesLength > 0)
            this.selectedIndex = (this.selectedIndex || 0) + (_indexChange || 0);

        if (this.selectedIndex)
            this.selectedIndex = Math.min(Math.max(this.selectedIndex, 0), matchesLength - 1);

        if (oldValue !== this.selectedIndex)
            this.highlighter.selectHighlight(this.selectedIndex);

        if (!this.totalMatches)
        {
            this.totalMatchesLabel = this.mainDiv.querySelector('.totalMatches');
            this.selectedMatchLabel = this.mainDiv.querySelector('.selectedMatch');
        }
        this.selectedMatchLabel.textContent = matchesLength == 0 ? "0" : `${this.selectedIndex + 1}`;
        this.totalMatchesLabel.textContent = matchesLength;
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

export default SearchBar;