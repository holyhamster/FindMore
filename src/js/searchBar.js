import DOMSearcher from './domSearcher.js';

const TFSearchBarID = "TFSearchBar";
const matchUpdateEventName = "TF-matches-update";
const barClosedEventName = "TF-bar-closed";
class SearchBar
{
    id;

    mainDiv;
    searchState;
    searcherRef;

    onClose;
    onSearchChange;

    color;

    selectedIndex;
    intersectionObserver;

    constructor(_id, _state, _order)
    {
        this.id = _id;
        this.searchState = _state;

        this.classNames = getCSSClassSchema(_id);

        
        this.color = _state.color;

        this.onClose = new Event(barClosedEventName);
        this.onClose.id = this.id;

        this.onSearchChange = new Event("tf-search-changed");
        this.onSearchChange.id = this.id;
        this.onSearchChange.id = this.id;

        this.highlightCSS = new CSSStyleSheet();
        this.highlightCSS.replaceSync(
            `.${this.classNames.highlight}` +
            `{ background-color: ${this.color}; opacity: 0.4; z-index: 147483647;}` +
            `.${this.classNames.highlightSelected}` +
            `{ border: 5px solid ${invertHex(this.color)}; padding: 0px;}`);
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, this.highlightCSS];

        this.constructHtml();
        this.setPosition(_order);
        
        if (this.searchState && this.searchState.searchString != "")
        {
            console.log("here")
            this.startSearcher();
        }

    }

    setPosition(_order)
    {

        this.mainDiv.style.top = (_order * 70) + 10 + "px";
    }

    //#region HTML
    constructHtml()
    {
        let topFlex = document.createElement("div");
        topFlex.innerHTML = `
            <input id="searchInput${this.id}" value="${this.searchState.searchString}">
            <span id="matchesLabel${this.id}" 
                style="min-width: 100px; margin-left: auto;">0/0</span>
            <button id="refreshButton${this.id}" style="margin-left: auto;">R</button>
            <button id="downButton${this.id}" style="margin-right: auto;">v</button>
            <button id="upButton${this.id}" style="margin-right: auto;">^</button>
            <button id="closeButton${this.id}" style="margin-right: auto;">x</button>`;
        topFlex.style = `display: flex;`;

        topFlex.querySelector(`#searchInput${this.id}`)
            .addEventListener("input", function (e) { this.restartSearch(e) }.bind(this));
        topFlex.querySelector(`#searchInput${this.id}`)
            .addEventListener("keydown", function (e)
            {
                if (e.key === "Enter")
                    this.nextMatch()
            }.bind(this));
        topFlex.querySelector(`#refreshButton${this.id}`)
            .addEventListener("click", function () { this.restartSearch() }.bind(this));
        topFlex.querySelector(`#downButton${this.id}`)
            .addEventListener("click", function () { this.nextMatch() }.bind(this));
        topFlex.querySelector(`#upButton${this.id}`)
            .addEventListener("click", function () { this.previousMatch() }.bind(this));
        topFlex.querySelector(`#closeButton${this.id}`)
            .addEventListener("click", function () { this.close() }.bind(this));


        


        let botFlex = document.createElement("div");
        botFlex.innerHTML = `
                <input type="checkbox" id="caseCheck${this.id}" 
                    ${this.searchState.caseSensetive? 'cached': ''} name="caseCheck${this.id}">
                <label for="caseCheck${this.id}">match case</label>
                <input type="checkbox" id="wordCheck${this.id}" 
                    ${this.searchState.wholeWord ? 'cached' : ''} name="wordCheck{this.id}">
                <label for="wordCheck${this.id}">whole word</label>
                <button type="button" id="pinButton${this.id}" style="margin-right:auto;">
                    ${this.searchState.pinned? 'PINNED': 'NOT PINNED'}
                </button>`;
        botFlex.style = `display: flex;`
        botFlex.querySelector(`#caseCheck${this.id}`)
            .addEventListener("input", function (e) { this.caseChange(e) }.bind(this));
        botFlex.querySelector(`#wordCheck${this.id}`)
            .addEventListener("input", function (e) { this.wholeWordChange(e)}.bind(this));
        botFlex.querySelector(`#pinButton${this.id}`)
            .addEventListener("click", function () { this.pinButtonPressed() }.bind(this));
        this.mainDiv = this.constructMainDiv();

        this.mainDiv.appendChild(topFlex);
        this.mainDiv.appendChild(botFlex);

        let shadowroot = this.getShadowRoot();
        shadowroot.appendChild(this.mainDiv);

        topFlex.querySelector(`#searchInput${this.id}`).focus();
    }

    getShadowRoot()
    {
        let shadowDiv = document.getElementById("TFShadowRoot");
        if (!shadowDiv)
        {
            shadowDiv = document.createElement("div");
            shadowDiv.setAttribute("id", "TFShadowRoot");
            shadowDiv.style.all = `<style>:host {all:initial;} </style>`;
            document.body.appendChild(shadowDiv);
        }

        if (shadowDiv.shadowRoot)
            return shadowDiv.shadowRoot;

        shadowDiv.attachShadow({ mode: "open" });
        return shadowDiv.shadowRoot;
    }

    constructMainDiv()
    {
        let main = document.createElement("div");
        main.setAttribute("class", `TFSearchBar`);
        main.setAttribute("id", `TFSearchBar${this.id}`);
        main.style = `position: fixed; display: flex; flex-direction: column; opacity: 0.8;
              top: 10px; right: 10px; min-width: 300px; padding: 10px; z-index: 147483647;
              background-color: ${this.color};`

        return main;
    }

    //#endregion

    close()
    {
        document.dispatchEvent(this.onClose);
        if (this.searcherRef)
            this.stopSearcher();

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
    caseChange(_args)
    {
        if (this.searchState.caseSensitive == _args.target.checked)
            return;

        this.searchState.caseSensitive = _args.target.checked;
        this.restartSearch();
    }
    wholeWordChange(_args)
    {
        if (this.searchState.wholeWord == _args.target.checked)
            return;

        this.searchState.wholeWord = _args.target.checked;
        this.restartSearch();
    }
    pinButtonPressed()
    {
        if (!this.pinButton)
            this.pinButton = this.mainDiv.querySelector(`#pinButton${this.id}`);

        this.searchState.pinned = !this.searchState.pinned;
        this.pinButton.textContent = (this.searchState.pinned ? "PINNED" : "NOT PINNED");

        document.dispatchEvent(this.onSearchChange);
    }

    restartSearch(_args)
    {
        let newValue = false;
        if (_args && _args.target &&
            this.searchState.searchString != _args.target.value)
        {
            this.searchState.searchString = _args.target.value;
            newValue = true;
        }

        if (this.searcherRef)
            this.stopSearcher();

        this.selectedIndex = null;
        this.updateLabels();

        if (this.searchState.searchString != "")
            this.startSearcher();

        if (newValue)
            document.dispatchEvent(this.onSearchChange);
    }

    previousMatch()
    {
        if (!this.searcherRef || this.searcherRef.getMatches().length == 0)
            return;

        if (this.selectedIndex == null)
            this.selectedIndex = 0;
        else
            this.selectedIndex -= 1;

        if (this.selectedIndex < 0)
            this.selectedIndex = this.searcherRef.getMatches().length - 1;

        this.searcherRef.selectHighlight(this.selectedIndex);
        this.updateLabels()
    }

    nextMatch()
    {
        if (!this.searcherRef || this.searcherRef.getMatches().length == 0)
            return;

        if (this.selectedIndex == null)
        {
            this.selectedIndex = 0;
        }
        else
        {
            this.selectedIndex += 1;
        }

        if (this.selectedIndex >= this.searcherRef.getMatches().length)
        {
            this.selectedIndex = 0;
        }

        this.searcherRef.selectHighlight(this.selectedIndex);
        this.updateLabels()
    }

    startSearcher()
    {
        if (this.searcherRef)
            this.stopSearcher();

        this.searcherRef = new DOMSearcher(this.id,
            this.searchState.searchString, this.searchState.regexpOptions);
        document.addEventListener(
            `${matchUpdateEventName}${this.id}`, this.updateLabels.bind(this));
        this.updateLabels();
    }
    stopSearcher()
    {
        if (this.searcherRef)
        {
            this.searcherRef.interrupt();
            removeDOMClass(this.classNames.hlContainer);
            this.selectedIndex = null;
            document.removeEventListener(
                `${matchUpdateEventName}${this.id}`, this.updateLabels);
        }
    }

    updateLabels()
    {
        if (!this.progressLabel)
            this.progressLabel = this.mainDiv.querySelector(`#matchesLabel${this.id}`);

        if (this.selectedIndex == null && this.searcherRef?.getMatches().length > 0)
        {
            this.selectedIndex = 0;
            this.searcherRef.selectHighlight(this.selectedIndex);
        }

        const labelText = (this.selectedIndex == null ? '0' : (this.selectedIndex + 1)) + `/` + 
            (this.searcherRef == null ? 0 : this.searcherRef.getMatches().length);
        this.progressLabel.textContent = labelText;

    }
}

function removeDOMClass(_className)
{
    let highlights = document.querySelectorAll(`.${_className}`);

    for (let i = 0; i < highlights.length; i++)
    {
        highlights[i].remove();
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
export default SearchBar;