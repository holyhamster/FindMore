import DOMSearcher from './domSearcher.js';
import Highlighter from './highlighter.js';

class SearchBar
{
    domSearcher;
    highlighter;

    selectedIndex;

    constructor(_id, _state, _order)
    {
        this.id = _id;
        this.state = _state;

        this.onClose = new Event("tf-bar-closed");
        this.onClose.id = this.id;

        this.onSearchChange = new Event("tf-search-changed");
        this.onSearchChange.id = this.id;

        this.constructHtml();
        this.setPosition(_order);

        if (this.state && this.state.searchString != "")
            this.startDomSearch(this.state, this.id);
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
            .addEventListener("click", function () { this.updateLabels(1) }.bind(this));
        topFlex.querySelector(`.upButton`)
            .addEventListener("click", function () { this.updateLabels(-1) }.bind(this));
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
        this.mainDiv.addEventListener("tf-matches-update",
            function(_args) { this.updateLabels(_args.length); }.bind(this));

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
              background-color: ${this.state.color};`
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
                _state.color, _state.secondaryColor);

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
        let matchesLength  = this.domSearcher?.getCount();
        if (matchesLength && matchesLength > 0)
        {
            let oldValue = this.selectedIndex;

            if (this.selectedIndex == null)
                this.selectedIndex = 0;

            if (_indexChange)
                this.selectedIndex += _indexChange;

            if (this.selectedIndex >= matchesLength)
                this.selectedIndex = 0;

            if (this.selectedIndex < 0)
                this.selectedIndex = matchesLength - 1;

            if (oldValue != this.selectedIndex)
                this.highlighter.selectHighlight(this.selectedIndex);
        }

        if (!this.progressLabel)
            this.progressLabel = this.mainDiv.querySelector(`.matchesLabel`);

        if (this.selectedIndex == null && this.domSearcher?.getCount() > 0)
        {
            this.selectedIndex = 0;
            this.domSearcher.selectHighlight(this.selectedIndex);
        }

        const labelText = (this.selectedIndex == null ? '0' : (this.selectedIndex + 1))
            + `/` + (this.domSearcher == null ? 0 : this.domSearcher.getCount());
        this.progressLabel.textContent = labelText;
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