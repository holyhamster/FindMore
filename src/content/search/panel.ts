import { RootNode } from './rootNode';
import { Styler } from './cssStyling/styler';
import { GetPanelColorCSS } from './cssStyling/cssInjection';
import { State } from './state';
import {
    ClosePanelsEvent, SearchRestartEvent, IndexChangeEvent
} from './search';

//Creates and controls on-page UI for a single search, and css through Styler instance
//Head element is used to dispatch events

export class Panel {
    mainNode;

    constructor(public id: number, public state: State, options: any) {
        this.mainNode = buildPanel(id, state);
        this.addHTMLEvents();

        RootNode.Get().appendChild(this.mainNode);
        
        if (state.IsEmpty())
            (this.mainNode.querySelector(`.searchInput`) as HTMLInputElement)?.focus();

        new Styler(id, this.mainNode, state.colorIndex, options?.highlightAlpha);
    }


    addHTMLEvents() {
        const mainNode = this.mainNode, state = this.state, id = this.id;

        mainNode.querySelector(`.colorButton`)?.addEventListener("click", () => {
            state.NextColor();
            mainNode.setAttribute("style", GetPanelColorCSS(state.colorIndex));
            mainNode.dispatchEvent(new ColorChangeEvent(state.colorIndex));
        });

        mainNode.querySelector(`.refreshButton`)?.addEventListener("click", () => {
            mainNode.dispatchEvent(new SearchRestartEvent());
        });

        mainNode.querySelector(`.downButton`)?.addEventListener("click", () => {
            mainNode.dispatchEvent(new IndexChangeEvent(1));
        });

        mainNode.querySelector(`.upButton`)?.addEventListener("click", () => {
            mainNode.dispatchEvent(new IndexChangeEvent(-1));
        });

        mainNode.querySelector(`.closeButton`)?.addEventListener("click", () => {
            mainNode.dispatchEvent(new ClosePanelsEvent(id));
        });

        mainNode.querySelector(`.caseCheck`)?.addEventListener("input", (args) => {
            if (state.caseSensitive == (args?.target as HTMLInputElement)?.checked)
                return;

            state.caseSensitive = (args?.target as HTMLInputElement)?.checked;
            mainNode.dispatchEvent(new SearchRestartEvent());
        });

        mainNode.querySelector(`.wordCheck`)?.addEventListener("input", (args) => {
            if (state.wholeWord == (args?.target as HTMLInputElement)?.checked)
                return;

            state.wholeWord = (args.target as HTMLInputElement).checked;
            mainNode.dispatchEvent(new SearchRestartEvent());
        });

        mainNode.querySelector(`.pinButton`)?.addEventListener("click", (args) => {
            
            state.pinned = !state.pinned;
            if (state.pinned)
                mainNode.classList.add('pinned');
            else
                mainNode.classList.remove('pinned');

            if (args?.target)
                (args.target as HTMLElement).textContent = state.pinned ? "\u{25A3}" : "\u{25A2}";
        });

        const searchInput = mainNode.querySelector(`.searchInput`);
        searchInput?.addEventListener("keypress", function (event) {
            event.stopPropagation();
        }, true);

        searchInput?.addEventListener("input", (args: any) => {
            if (!args?.target)
                return;
            const safeValue = formatIncomingString(args.target.value);
            args.target.value = safeValue;
            const inputChanged = safeValue != state.searchString;
            state.searchString = safeValue;
            if (inputChanged) {
                mainNode.dispatchEvent(new SearchRestartEvent());
            }
        });
        searchInput?.addEventListener("keydown", (event: any) => {
            if (event.key === "Enter")
                mainNode.dispatchEvent(new IndexChangeEvent(1));
            else if (event.key === "Escape")
                mainNode.dispatchEvent(new ClosePanelsEvent(id));
            //prevent other javascript in the document from reacting to keypresses
            event.stopImmediatePropagation();
        });
        searchInput?.addEventListener("focus", () => {
            mainNode.classList.add('focused');
        });
        searchInput?.addEventListener("focusout", () => {
            Panel.lastFocusedPanel = mainNode;
            mainNode.classList.remove('focused');
        });

        mainNode.addEventListener(ClosePanelsEvent.type, () => {
            const refocus = this.IsFocused();
            mainNode.remove();
            if (Panel.lastFocusedPanel == mainNode)
                Panel.lastFocusedPanel = undefined;
            if (refocus)
                Panel.NextFocus();
        });
    }

    IsFocused() {
        return this.mainNode.classList.contains("focused");
    }

    GetEventRoot() {
        return this.mainNode;
    }

    //If one of the panels is focused, focuses previously adjustened
    //if none selected, selects the one that focused last
    //if none selected and last focused doesn't exists, selects the first one
    static lastFocusedPanel?: HTMLElement;
    static NextFocus() {
        const panelsNodes = RootNode.GetLocalEventRoots();
        const currentFocusedPanel = panelsNodes.filter((node) => node.classList.contains("focused"))?.[0];

        let newFocusedPanel;
        if (!currentFocusedPanel) {
            newFocusedPanel = Panel.lastFocusedPanel || panelsNodes[0];
        }

        if (!newFocusedPanel && panelsNodes.length > 1) {
            const focusedIndex = panelsNodes.indexOf(currentFocusedPanel);
            const newFocusIndex = focusedIndex - 1 >= 0 ? focusedIndex - 1 : panelsNodes.length - 1;
            newFocusedPanel = panelsNodes[newFocusIndex];
        }
        (newFocusedPanel?.querySelector(`.searchInput`) as HTMLInputElement)?.focus();
    }

    totalMatchesLabel?: HTMLElement;
    selectedMatchLabel?: HTMLElement;
    updateLabels(index: number, length: number) {
        if (!this.totalMatchesLabel) {
            this.totalMatchesLabel = this.mainNode.querySelector('.totalMatches') as HTMLElement;
            this.selectedMatchLabel = this.mainNode.querySelector('.selectedMatch') as HTMLElement;
        }
        if (this.selectedMatchLabel)
            this.selectedMatchLabel.textContent = length == 0 ? "0" : `${index + 1}`;
        if (this.totalMatchesLabel)
            this.totalMatchesLabel.textContent = length.toString();
    }
}

function buildPanel(id: number, state: State) {
    const mainNode = document.createElement("div");
    mainNode.setAttribute("id", `FMPanel${id}`);
    mainNode.setAttribute("class", `FMPanel`);
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

    mainNode.setAttribute("style", GetPanelColorCSS(state.colorIndex));
    return mainNode;
}

function formatIncomingString(incomingString: string) {
    incomingString = incomingString || "";
    return incomingString.substring(0, 100);
}

export class ColorChangeEvent extends Event {
    static readonly type: string = "fm-color-change";
    constructor(public colorIndex: number) {
        super(ColorChangeEvent.type);
    }
}