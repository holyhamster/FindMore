import { Root } from './root.js';
import { Styler } from './cssStyling/styler.js';
import { PanelClass, GetPanelColorCSS } from './cssStyling/cssInjection.js';
import { State } from './state.js';
import {
GetClosePanelsEvent, GetSearchRestartEvent, GetChangeIndexEvent, GetStateChangeEvent
} from './search.js';

//On-page UI for a single search
//Sends events when search is changed
//Creates Styler to add search-related css

export class Panel {
    mainNode;

    constructor(id, stateRef, options) {
        this.id = id;
        this.state = stateRef;

        const mainDiv = getPanel(id, stateRef);
        this.mainNode = mainDiv;
        this.addHTMLEvents();

        Root.Get().appendChild(mainDiv);

        if (stateRef.IsEmpty())
            mainDiv.querySelector(`.searchInput`).focus();

        this.styler = new Styler(id, mainDiv, stateRef.colorIndex, options?.highlightAlpha);
    }

    addHTMLEvents() {
        const mainNode = this.mainNode, state = this.state, id = this.id;

        mainNode.addEventListener(GetClosePanelsEvent().type, () => {
            mainNode.remove();
        });

        mainNode.querySelector(`.searchInput`).addEventListener("input", (args) => {
            if (!args?.target)
                return;
            const safeValue = formatIncomingString(args.target.value);
            args.target.value = safeValue;
            const inputChanged = safeValue != state.searchString;
            state.searchString = safeValue;
            if (inputChanged) {
                mainNode.dispatchEvent(GetStateChangeEvent(id));
                mainNode.dispatchEvent(GetSearchRestartEvent());
            }
        });

        mainNode.querySelector(`.searchInput`).addEventListener("keydown", (event) => {
            if (event.key === "Enter")
                mainNode.dispatchEvent(GetChangeIndexEvent(1));
            else if (event.key === "Escape")
                mainNode.dispatchEvent(GetClosePanelsEvent(id));
            //prevent other javascript in the document from reacting to keypresses
            event.stopImmediatePropagation();
        });

        mainNode.querySelector(`.colorButton`).addEventListener("click", () => {
            state.NextColor();
            mainNode.style = GetPanelColorCSS(state.colorIndex);
            mainNode.dispatchEvent(GetStateChangeEvent(id));
            this.styler.SetColor(state.colorIndex);
        });

        mainNode.querySelector(`.refreshButton`).addEventListener("click", () => {
            mainNode.dispatchEvent(GetSearchRestartEvent());
        });

        mainNode.querySelector(`.downButton`).addEventListener("click", () => {
            mainNode.dispatchEvent(GetChangeIndexEvent(1));
        });

        mainNode.querySelector(`.upButton`).addEventListener("click", () => {
            mainNode.dispatchEvent(GetChangeIndexEvent(-1));
        });

        mainNode.querySelector(`.closeButton`).addEventListener("click", () => {
            mainNode.dispatchEvent(GetClosePanelsEvent(id));
        });

        mainNode.querySelector(`.caseCheck`).addEventListener("input", (args) => {
            if (state.caseSensitive == args.target.checked)
                return;

            state.caseSensitive = args.target.checked;
            mainNode.dispatchEvent(GetStateChangeEvent(id));
            mainNode.dispatchEvent(GetSearchRestartEvent());
        });

        mainNode.querySelector(`.wordCheck`).addEventListener("input", (args) => {
            if (state.wholeWord == args?.target?.checked)
                return;

            state.wholeWord = args.target.checked;
            mainNode.dispatchEvent(GetStateChangeEvent(id));
            mainNode.dispatchEvent(GetSearchRestartEvent());
        });

        mainNode.querySelector(`.pinButton`).addEventListener("click", (args) => {
            state.pinned = !state.pinned;
            if (state.pinned)
                mainNode.classList.add('pinned');
            else
                mainNode.classList.remove('pinned');

            if (args?.target)
                args.target.textContent = state.pinned ? "\u{25A3}" : "\u{25A2}";
            mainNode.dispatchEvent(GetStateChangeEvent(id));
        });
    }

    updateLabels(index, length) {
        if (!this.totalMatchesLabel) {
            this.totalMatchesLabel = this.mainNode.querySelector('.totalMatches');
            this.selectedMatchLabel = this.mainNode.querySelector('.selectedMatch');
        }
        this.selectedMatchLabel.textContent = length == 0 ? "0" : `${index + 1}`;
        this.totalMatchesLabel.textContent = length;
    }

    GetLocalRoot() {
        return this.mainNode;
    }
}

function getPanel(id, state) {
    const mainNode = document.createElement("div");
    mainNode.setAttribute("id", `${PanelClass}${id}`);
    mainNode.setAttribute("class", `${PanelClass}`);
    if (state.pinned)
        mainNode.classList.add("pinned");
    
    mainNode.innerHTML =
        `<div>
            <input class="searchInput" value="${state.searchString}" placeholder=" Find in page">
            <button class="upButton">&#x25B3</button>
            <button class="downButton">&#x25BD</button>
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

    mainNode.style = GetPanelColorCSS(state.colorIndex);
    return mainNode;
}

function formatIncomingString(incomingString) {
    incomingString = incomingString || "";
    return incomingString.substring(0, 100);
}