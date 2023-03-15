import DOMSearcher from './DOMSearch/domSearcher.js';
import Highlighter from './DOMSearch/highlighter.js';
import ShadowrootCSS from './cssStyling/cssInjection.js'
import Styler from './cssStyling/styler.js';

//creates and controls search panel element
//starts the search with DOMSearcher, marks results with Highlighter and sets css with Styler
class SearchPanel
{
    constructor(id, state)
    {
        this.id = id;
        this.state = state;

        this.onClose = new Event("fm-bar-closed");
        this.onClose.id = this.id;

        this.onStateChange = new Event("fm-search-changed");
        this.onStateChange.id = this.id;

        this.mainDiv = this.constructPanel(id, state);

        SearchPanel.getShadowRoot().appendChild(this.mainDiv);
        this.addHTMLEvents();
        this.styler = new Styler(id, this.mainDiv);
        this.styler.set(state.getColor(), state.getAccentedColor());

        if (this.state.searchString == "")
            this.mainDiv.querySelector(`.searchInput`).focus();
        else
            this.startDomSearch();
    }

    //#region SEARCHBAR_DOM_ELEMENT
    constructPanel(id, state)
    {
        const mainDiv = document.createElement("div");
        mainDiv.setAttribute("class", `TFSearchBar${state.pinned ? " pinned" : ""}`);
        mainDiv.setAttribute("id", `TFSearchBar${id}`);

        mainDiv.style.setProperty("--themeHue", state.hue);

        mainDiv.innerHTML =
            ` <div>
            <input class="searchInput" value="${state.searchString}" placeholder=" Find in page">
            <button class="downButton">&#x25BD</button>
            <button class="upButton">&#x25B3</button>
            <button class="refreshButton">&#x21BA</button>
            <button class="closeButton">X</button> 
        </div>
        <div>
            <span class="selectedMatch">0</span>
            <span>/</span>
            <span class="totalMatches">0</span>
            <input type="checkbox" class="caseCheck" id="caseCheck${id}" name="caseCheck${id}"
                ${state.caseSensitive ? "checked" : ""}>
            <label for="caseCheck${id}">CasE</label>
            <input type="checkbox" class="wordCheck" id="wordCheck${id}" name="wordCheck${id}"
                ${state.wholeWord ? "checked" : ""}>
            <label for="wordCheck${id}" class="wordLabel">_phrase_</label>
            <button class="colorButton button-28">&#x25D1</button>
            <button class="pinButton"> ${state.pinned ? "\u{25A3}" : "\u{25A2}"}</button>
        </div>`;

        mainDiv.querySelector(`.searchInput`).focus();
        return mainDiv;
    }

    addHTMLEvents()
    {
        const mainDiv = this.mainDiv;

        mainDiv.addEventListener("fm-new-matches-update",
            (_args) => { this.updateIndex(); });

        mainDiv.querySelector(`.searchInput`).addEventListener("input", (_args) =>
        {
            if (!_args?.target)
                return;
            _args.target.value = formatIncomingString(_args.target.value);
            const inputChanged = _args.target.value != this.state.searchString;
            this.state.searchString = _args.target.value;
            if (inputChanged)
                document.dispatchEvent(this.onStateChange);
            this.restartSearch();
        });

        mainDiv.querySelector(`.searchInput`).addEventListener("keydown", (_args) =>
        {
            if (_args.key === "Enter")
                this.updateIndex(1)
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
            this.restartSearch()
        });

        mainDiv.querySelector(`.downButton`).addEventListener("click", () => {this.updateIndex(1)});

        mainDiv.querySelector(`.upButton`).addEventListener("click", () => { this.updateIndex(-1) });

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
            document.dispatchEvent(this.onStateChange);
            this.restartSearch();
        });

        mainDiv.querySelector(`.wordCheck`).addEventListener("input", (_args) =>
        {
            if (this.state.wholeWord == _args.target.checked)
                return;

            this.state.wholeWord = _args.target.checked;
            document.dispatchEvent(this.onStateChange);
            this.restartSearch();
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
            document.dispatchEvent(this.onStateChange);
        });
    }

    updateLabels(index, length)
    {
        if (!this.totalMatchesLabel)
        {
            this.totalMatchesLabel = this.mainDiv.querySelector('.totalMatches');
            this.selectedMatchLabel = this.mainDiv.querySelector('.selectedMatch');
        }
        this.selectedMatchLabel.textContent = length == 0 ? "0" : `${index + 1}`;
        this.totalMatchesLabel.textContent = length;
    }

    static shadowRoot;
    static getShadowRoot()
    {
        if (SearchPanel.shadowRoot)
            return SearchPanel.shadowRoot;

        let shadowHolder = document.getElementById("TFShadowRoot");
        if (!shadowHolder)
        {
            shadowHolder = document.createElement("div");
            shadowHolder.setAttribute("id", "TFShadowRoot");
            document.body.appendChild(shadowHolder);
        }

        SearchPanel.shadowRoot = document.createElement("div");
        SearchPanel.shadowRoot.setAttribute("id", "TFBarsContainer");

        const css = document.createElement("div");
        css.style = "all: initial";
        css.innerHTML = `<style>${ShadowrootCSS}</style>`;
        css.appendChild(SearchPanel.shadowRoot);

        const shadow = shadowHolder.attachShadow({ mode: "closed" });
        shadow.appendChild(css);

        SearchPanel.shadowRoot.setStyleFromOptions = (_options) =>
            { setStyleFromOptions(SearchPanel.shadowRoot, _options) };
;
        return SearchPanel.shadowRoot;
    }
    //#endregion

    //#region SEARCH_CONTROLS
    restartSearch()
    {
        this.selectedIndex = null;
        this.updateIndex();
        this.startDomSearch();       
    }

    domSearcher;
    highlighter;
    startDomSearch()
    {
        this.clearPreviousSearch(this.id);
        
        if (this.state.searchString != "")
        {
            this.highlighter = this.highlighter || new Highlighter(this.id, this.mainDiv,
                this.state.getColor(), this.state.getAccentedColor());

            this.domSearcher = new DOMSearcher(
                this.state.searchString, this.state.getRegex(true),
                this.mainDiv, this.highlighter);
        }
        this.updateIndex();
    }

    clearPreviousSearch()
    {
        this.domSearcher?.interrupt();
        this.domSearcher = null;

        this.highlighter?.clearSelection();
        //this.selectedIndex = null;
    }

    close()
    {
        this.clearPreviousSearch();
        this.mainDiv.remove();

        //removing thousands of highlights can result in a significant reflow time
        //allowing the page to remove the search panel first makes it less noticable
        setTimeout(() => { this.styler.clearStyles(); }, 10);   
    }

    selectedIndex;
    updateIndex(indexChange)
    {
        const matchesLength = this.highlighter?.getMatchCount() || 0;

        if (this.selectedIndex == null)
            this.selectedIndex = this.highlighter?.getNewClosestMatch();
        else
            this.selectedIndex = normalizeSearchIndex(this.selectedIndex, indexChange, matchesLength);

        if (!isNaN(this.selectedIndex))
            this.highlighter?.accentMatch(this.selectedIndex);

        this.updateLabels(this.selectedIndex, matchesLength);
    }

    
}

function formatIncomingString(string)
{
    if (!string)
        return "";
    if (string.length > 100)
        string = string.substring(0, 100);
    return string;
}

function setStyleFromOptions(shadowRoot, options)
{
    const startTop = options ? options.corner < 2 : true;
    const startLeft = options ? (options.corner == 0 || options.corner == 2) : false;
    const horizontal = options ? options.alignment == 1 : false;

    const style = shadowRoot.style;
    const screenGap = "5px";
    style.top = startTop ? screenGap : "";
    style.bottom = startTop ? "" : screenGap;
    style.left = startLeft ? screenGap : "";
    style.right = startLeft ? "" : screenGap;

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
    
    style.setProperty("--themeAlpha", options?.opacity ? options.opacity : .95);
    style.setProperty("--scale-ratio", options?.scale ? options.scale : 1);
}

function normalizeSearchIndex(current, change, matchCount)
{
    if (matchCount <= 0)
        return null;

    current = (current || 0) + (change || 0);
    if (current < 0)
        current = matchCount - 1;
    else if (current >= matchCount)
        current = 0;

    return current;
}

export default SearchPanel;