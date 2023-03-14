import DOMSearcher from './DOMSearch/domSearcher.js';
import Highlighter from './DOMSearch/highlighter.js';
import ShadowrootCSS from './styling/cssInjection.js'
import Styler from './styling/styler.js';

//creates and controls search panel element
//starts the search with DOMSearcher, marks results with Highlighter and sets css with Styler
class SearchBar
{
    constructor(_id, _state)
    {
        this.id = _id;
        this.state = _state;

        this.onClose = new Event("tf-bar-closed");
        this.onClose.id = this.id;

        this.onSearchChange = new Event("tf-search-changed");
        this.onSearchChange.id = this.id;

        this.mainDiv = this.constructPanel(_state);

        
        SearchBar.getShadowRoot().appendChild(this.mainDiv);
        this.addHTMLEvents();
        this.styler = new Styler(_id, this.mainDiv);
        this.styler.set(this.state.getColor(), this.state.getAccentedColor());

        if (this.state.searchString == "")
            this.mainDiv.querySelector(`.searchInput`).focus();
        else
            this.startDomSearch(this.state, this.id);
    }

    //#region HTML
    constructPanel(_state)
    {
        const mainDiv = document.createElement("div");
        mainDiv.setAttribute("class", `TFSearchBar${_state.pinned? " pinned": ""}`);
        mainDiv.setAttribute("id", `TFSearchBar${this.id}`);

        mainDiv.style.setProperty("--themeHue", _state.hue);

        mainDiv.innerHTML = `
            <div>
                <input class="searchInput" value="${_state.searchString}" placeholder=" Find in page">
                <button class="downButton">&#x25BD</button>
                <button class="upButton">&#x25B3</button>
                <button class="refreshButton">&#x21BA</button>
                <button class="closeButton">X</button> 
            </div>
            <div>
                <span class="selectedMatch">0</span>
                <span>/</span>
                <span class="totalMatches">0</span>
                <input type="checkbox" class="caseCheck" id="caseCheck${this.id}" name="caseCheck${this.id}"
                    ${_state.caseSensitive ? "checked" : ""}>
                <label for="caseCheck${this.id}">CasE</label>
                <input type="checkbox" class="wordCheck" id="wordCheck${this.id}" name="wordCheck${this.id}"
                    ${this.state.wholeWord ? "checked" : ""}>
                <label for="wordCheck${this.id}" class="wordLabel">_phrase_</label>
                <button class="colorButton button-28">&#x25D1</button>
                <button class="pinButton"> ${_state.pinned ? "\u{25A3}" : "\u{25A2}"}</button>
            </div>`;

        mainDiv.querySelector(`.searchInput`).focus();
        return mainDiv;
    }

    addHTMLEvents()
    {
        const mainDiv = this.mainDiv;

        mainDiv.addEventListener("tf-new-matches-update",
            (_args) => { this.updateLabels(); });

        mainDiv.querySelector(`.searchInput`).addEventListener("input", (_args) =>
        {
            if (!_args?.target)
                return;
            _args.target.value = formatIncomingString(_args.target.value);
            const inputChanged = _args.target.value != this.state.searchString;
            this.state.searchString = _args.target.value;
            if (inputChanged)
                document.dispatchEvent(this.onSearchChange);
            this.restartSearch(this.state, this.id);
        });

        mainDiv.querySelector(`.searchInput`).addEventListener("keydown", (_args) =>
        {
            if (_args.key === "Enter")
                this.updateLabels(1)
        });

        this.mainDiv.querySelector(`.colorButton`).addEventListener("click", () =>
        {
            this.state.recolor();       
            mainDiv.style.setProperty("--themeHue", this.state.hue);
            //this.highlighter?.setStyle(this.state.getColor(), this.state.getAccentedColor());
            this.styler.set(this.state.getColor(), this.state.getAccentedColor());
        });

        mainDiv.querySelector(`.refreshButton`).addEventListener("click", () =>
        {
            this.restartSearch(this.state, this.id)
        });

        mainDiv.querySelector(`.downButton`).addEventListener("click", () => {this.updateLabels(1)});

        mainDiv.querySelector(`.upButton`).addEventListener("click", () => { this.updateLabels(-1) });

        mainDiv.querySelector(`.closeButton`).addEventListener("click", () =>
        {
            this.close();
            document.dispatchEvent(this.onClose);
        });

        mainDiv.querySelector(`.caseCheck`).addEventListener("input", (_args) =>
        {            
            if (this.state.caseSensitive == _args.target.checked)
                return;

            this.state.caseSensitive = _args.target.checked;
            document.dispatchEvent(this.onSearchChange);
            this.restartSearch(this.state, this.id);
        });

        mainDiv.querySelector(`.wordCheck`).addEventListener("input", (_args) =>
        {
            if (this.state.wholeWord == _args.target.checked)
                return;

            this.state.wholeWord = _args.target.checked;
            document.dispatchEvent(this.onSearchChange);
            this.restartSearch(this.state, this.id);
        });

        mainDiv.querySelector(`.pinButton`).addEventListener("click", (_args) =>
        {
            this.pinButton = this.pinButton || mainDiv.querySelector(`.pinButton`);
            this.state.pinned = !this.state.pinned;

            if (this.state.pinned)
                mainDiv.classList.add('pinned');
            else
                mainDiv.classList.remove('pinned');

            this.pinButton.textContent = (this.state.pinned ? "\u{25A3}" : "\u{25A2}");
            document.dispatchEvent(this.onSearchChange);
        });
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

        const css = document.createElement("div");
        css.style = "all: initial";
        css.innerHTML = `<style>${ShadowrootCSS}</style>`;
        css.appendChild(SearchBar.shadowRoot);

        const shadow = shadowHolder.attachShadow({ mode: "closed" });
        shadow.appendChild(css);

        SearchBar.shadowRoot.setStyleFromOptions = (_options) =>
            { setStyleFromOptions(SearchBar.shadowRoot, _options) };
;
        return SearchBar.shadowRoot;
    }
    //#endregion

    close()
    {
        this.clearPreviousSearch(this.id);
        this.styler.clearStyles();
        this.mainDiv.remove();
    }

    restartSearch(_state, _id)
    {
        this.selectedIndex = null;
        this.updateLabels();
        this.startDomSearch(_state, _id);       
    }

    domSearcher;
    highlighter;
    startDomSearch(_state, _id)
    {
        this.clearPreviousSearch(_id);
        
        if (_state.searchString != "")
        {
            this.highlighter = this.highlighter || new Highlighter(_id, this.mainDiv,
                _state.getColor(), _state.getAccentedColor());

            this.domSearcher = new DOMSearcher(
                _state.searchString, _state.getRegex(true),
                this.mainDiv, this.highlighter);
        }
        this.updateLabels();
    }

    clearPreviousSearch(_id)
    {
        this.domSearcher?.interrupt();
        this.domSearcher = null;

        this.highlighter?.clearSelection();
        //this.selectedIndex = null;
    }

    selectedIndex;
    updateLabels(indexChange)
    {
        const matchesLength = this.highlighter?.getMatchCount() || 0;


        this.selectedIndex = this.highlighter?.accentClosestMatch(
            this.normalizeSearchIndex(this.selectedIndex, indexChange, matchesLength));

        if (!this.totalMatchesLabel)
        {
            this.totalMatchesLabel = this.mainDiv.querySelector('.totalMatches');
            this.selectedMatchLabel = this.mainDiv.querySelector('.selectedMatch');
        }
        this.selectedMatchLabel.textContent = matchesLength == 0 ? "0" : `${this.selectedIndex + 1}`;
        this.totalMatchesLabel.textContent = matchesLength;
    }

    normalizeSearchIndex(_current, _change, _matchCount)
    {
        if (_matchCount <= 0)
            return null;

        _current = (_current || 0) + (_change || 0);
        if (_current < 0)
            _current = _matchCount - 1;
        else if (_current >= _matchCount)
            _current = 0;

        return _current;
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

function setStyleFromOptions(_shadowRoot, _options)
{
    const startTop = _options ? _options.corner < 2 : true;
    const startLeft = _options ? (_options.corner == 0 || _options.corner == 2) : false;
    const horizontal = _options ? _options.alignment == 1 : false;

    const style = _shadowRoot.style;

    style.top = startTop ? "0px" : "";
    style.bottom = startTop ? "" : "0px";
    style.left = startLeft ? "0px" : "";
    style.right = startLeft ? "" : "0px";

    if (horizontal)
    {
        style.flexDirection = startLeft ? "row" : "row-reverse";
        style.flexWrap = startTop ? "wrap" : "wrap-reverse";
    }
    else
    {
        style.flexDirection = startTop ? "column" : "column-reverse";
        style.flexWrap = startLeft ? "wrap" : "wrap-reverse";
    }
    
    style.setProperty("--themeAlpha", _options?.opacity ? _options.opacity : .95);
    style.setProperty("--scale-ratio", _options?.scale ? _options.scale : 1);
}

export default SearchBar;