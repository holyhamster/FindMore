import { Root } from './root.js';
import { Styler } from './cssStyling/styler.js';
import { PanelClass } from './cssStyling/cssInjection.js';
import { State } from './state.js';
import {
GetClosePanelsEvent, GetSearchRestartEvent, GetChangeIndexEvent, GetStateChangeEvent
} from './search.js';

//On-page UI for a single search
//Sends events when search is changed
//Creates Styler to add search-related css

export class Panel {
    mainDiv;

    constructor(id, stateRef, options) {
        this.id = id;
        this.state = stateRef;

        const mainDiv = getPanel(id, stateRef);
        this.mainDiv = mainDiv;
        this.addHTMLEvents();

        Root.Get().appendChild(mainDiv);

        if (stateRef.IsEmpty())
            mainDiv.querySelector(`.searchInput`).focus();

        this.styler = new Styler(id, mainDiv, stateRef.colorIndex, options?.highlightAlpha);
    }

    addHTMLEvents() {
        const mainDiv = this.mainDiv, state = this.state, id = this.id;

        mainDiv.addEventListener(GetClosePanelsEvent().type, (args) => {
            mainDiv.remove();
        });

        mainDiv.querySelector(`.searchInput`).addEventListener("input", (args) => {
            if (!args?.target)
                return;
            args.target.value = formatIncomingString(args.target.value);
            const inputChanged = args.target.value != state.searchString;
            state.searchString = args.target.value;
            if (inputChanged) {
                mainDiv.dispatchEvent(GetStateChangeEvent(id));
                mainDiv.dispatchEvent(GetSearchRestartEvent());
            }
        });

        mainDiv.querySelector(`.searchInput`).addEventListener("keydown", (args) => {
            if (args.key === "Enter")
                mainDiv.dispatchEvent(GetChangeIndexEvent(1));
        });

        mainDiv.querySelector(`.colorButton`).addEventListener("click", () => {
            state.NextColor();
            mainDiv.style.setProperty("--color1-hsl", `var(--light-color-${state.colorIndex}-hsl)`);
            mainDiv.style.setProperty("--color2-hsl", `var(--dark-color-${state.colorIndex}-hsl)`);
            mainDiv.dispatchEvent(GetStateChangeEvent(id));
            this.styler.SetColor(state.colorIndex);
        });

        mainDiv.querySelector(`.refreshButton`).addEventListener("click", () => {
            mainDiv.dispatchEvent(GetSearchRestartEvent());
        });

        mainDiv.querySelector(`.downButton`).addEventListener("click", () => {
            mainDiv.dispatchEvent(GetChangeIndexEvent(1));
        });

        mainDiv.querySelector(`.upButton`).addEventListener("click", () => {
            mainDiv.dispatchEvent(GetChangeIndexEvent(-1));
        });

        mainDiv.querySelector(`.closeButton`).addEventListener("click", () => {
            mainDiv.dispatchEvent(GetClosePanelsEvent(id));
        });

        mainDiv.querySelector(`.caseCheck`).addEventListener("input", (args) => {
            if (state.caseSensitive == args.target.checked)
                return;

            state.caseSensitive = args.target.checked;
            mainDiv.dispatchEvent(GetStateChangeEvent(id));
            mainDiv.dispatchEvent(GetSearchRestartEvent());
        });

        mainDiv.querySelector(`.wordCheck`).addEventListener("input", (args) => {
            if (state.wholeWord == args?.target?.checked)
                return;

            state.wholeWord = args.target.checked;
            mainDiv.dispatchEvent(GetStateChangeEvent(id));
            mainDiv.dispatchEvent(GetSearchRestartEvent());
        });

        mainDiv.querySelector(`.pinButton`).addEventListener("click", (args) => {
            state.pinned = !state.pinned;
            if (state.pinned)
                mainDiv.classList.add('pinned');
            else
                mainDiv.classList.remove('pinned');

            if (args?.target)
                args.target.textContent = state.pinned ? "\u{25A3}" : "\u{25A2}";
            mainDiv.dispatchEvent(GetStateChangeEvent(id));
        });
    }

    updateLabels(index, length) {
        if (!this.totalMatchesLabel) {
            this.totalMatchesLabel = this.mainDiv.querySelector('.totalMatches');
            this.selectedMatchLabel = this.mainDiv.querySelector('.selectedMatch');
        }
        this.selectedMatchLabel.textContent = length == 0 ? "0" : `${index + 1}`;
        this.totalMatchesLabel.textContent = length;
    }

    GetLocalRoot() {
        return this.mainDiv;
    }
}

function getPanel(id, state) {
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

function formatIncomingString(incomingString) {
    incomingString = incomingString || "";
    return incomingString.substring(0, 100);
}

export default Panel;