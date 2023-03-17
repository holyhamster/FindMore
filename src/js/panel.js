import { Styler } from './cssStyling/styler.js';
import { PanelClass } from './cssStyling/cssInjection.js';
import { Shadowroot } from './shadowroot.js';
import
    {
        GetClosePanelsEvent, GetSearchRestartEvent, GetChangeIndexEvent, GetStateChangeEvent
    } from './search.js';

export class Panel
{
    mainDiv;

    constructor(id, state, options)
    {
        this.id = id;
        this.state = state;

        const mainDiv = getPanel(id, state);
        this.mainDiv = mainDiv;

        Shadowroot.Get().appendChild(mainDiv);

        this.addHTMLEvents(id);
        
        if (state.searchString == "")
            this.mainDiv.querySelector(`.searchInput`).focus();

        this.styler = new Styler(id, mainDiv, state.colorIndex, options?.highlightAlpha);
    }
    
    addHTMLEvents(id)
    {
        const mainDiv = this.mainDiv, state = this.state;

        mainDiv.addEventListener(GetClosePanelsEvent().type, (args) =>
        {
            if (isNaN(args.id) || args.id == id)
            {
                mainDiv.remove();
            }
        });

        const onStateChange = new Event("fm-search-changed");
        onStateChange.id = id;

        mainDiv.querySelector(`.searchInput`).addEventListener("input", (_args) =>
        {
            if (!_args?.target)
                return;
            _args.target.value = formatIncomingString(_args.target.value);
            const inputChanged = _args.target.value != state.searchString;
            state.searchString = _args.target.value;
            if (inputChanged)
                mainDiv.dispatchEvent(GetStateChangeEvent(id));

            mainDiv.dispatchEvent(GetSearchRestartEvent());
        });

        mainDiv.querySelector(`.searchInput`).addEventListener("keydown", (_args) =>
        {
            if (_args.key === "Enter")
                mainDiv.dispatchEvent(GetChangeIndexEvent(1));
        });

        mainDiv.querySelector(`.colorButton`).addEventListener("click", () =>
        {
            state.nextColor();       
            mainDiv.style.setProperty("--color1-hsl", `var(--light-color-${state.colorIndex}-hsl)`);
            mainDiv.style.setProperty("--color2-hsl", `var(--dark-color-${state.colorIndex}-hsl)`);
            //this.highlighter?.setStyle(this.state.getColor(), this.state.getAccentedColor());
            mainDiv.dispatchEvent(GetStateChangeEvent(id));
            this.styler.SetColor(state.colorIndex);
        });

        mainDiv.querySelector(`.refreshButton`).addEventListener("click", () =>
        {
            mainDiv.dispatchEvent(GetSearchRestartEvent());
        });

        mainDiv.querySelector(`.downButton`).addEventListener("click", () =>
        {
            mainDiv.dispatchEvent(GetChangeIndexEvent(1));
        });

        mainDiv.querySelector(`.upButton`).addEventListener("click", () =>
        {
            mainDiv.dispatchEvent(GetChangeIndexEvent(-1));
        });

        mainDiv.querySelector(`.closeButton`).addEventListener("click", () =>
        {
            mainDiv.dispatchEvent(GetClosePanelsEvent(id));
        });

        mainDiv.querySelector(`.caseCheck`).addEventListener("input", (_args) =>
        {            
            if (state.caseSensitive == _args.target.checked)
                return;

            state.caseSensitive = _args.target.checked;
            mainDiv.dispatchEvent(GetStateChangeEvent(id));
            mainDiv.dispatchEvent(GetSearchRestartEvent());
        });

        mainDiv.querySelector(`.wordCheck`).addEventListener("input", (_args) =>
        {
            if (state.wholeWord == _args.target.checked)
                return;

            state.wholeWord = _args.target.checked;
            mainDiv.dispatchEvent(GetStateChangeEvent(id));
            mainDiv.dispatchEvent(GetSearchRestartEvent());
        });

        mainDiv.querySelector(`.pinButton`).addEventListener("click", (_args) =>
        {
            this.pinButton = this.pinButton || mainDiv.querySelector(`.pinButton`);
            state.pinned = !state.pinned;

            if (state.pinned)
                mainDiv.classList.add('pinned');
            else
                mainDiv.classList.remove('pinned');

            this.pinButton.textContent = (state.pinned ? "\u{25A3}" : "\u{25A2}");
            mainDiv.dispatchEvent(GetStateChangeEvent(id));
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

    GetLocalRoot()
    {
        return this.mainDiv;
    }
}

function getPanel(id, state)
{
    const mainDiv = document.createElement("div");
    mainDiv.setAttribute("class", `${PanelClass}${state.pinned ? " pinned" : ""}`);
    mainDiv.setAttribute("id", `${PanelClass}{id}`);

    mainDiv.style.setProperty("--color1-hsl", `var(--light-color-${state.colorIndex}-hsl)`);
    mainDiv.style.setProperty("--color2-hsl", `var(--dark-color-${state.colorIndex}-hsl)`);

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

function formatIncomingString(string)
{
    if (!string)
        return "";
    if (string.length > 100)
        string = string.substring(0, 100);
    return string;
}

export default Panel;