import { RootNode } from './rootNode';
import { GetPanelColorCSS } from './cssStyling/cssInjection';
import { State } from './state';
import {
    AdvanceIndexEvent, AdvanceIndexEmitter,
    ClosePanelsEvent, ClosePanelEmitter, ClosePanelListener,
    ColorChangeEvent, ColorChangeEmitter,
    IndexChangeEvent, IndexChangeListener,
    NewMatchesEvent, NewMatchesListener,
    SearchRestartEvent, SearchRestartEmitter, SearchRestartListener
} from './searchEvents';

//Creates and controls on-page UI for a single search, and css through Styler instance
//Head element is used to dispatch events

export class Panel implements ClosePanelListener, ClosePanelEmitter, NewMatchesListener,
    IndexChangeListener, SearchRestartEmitter, SearchRestartListener, ColorChangeEmitter,
    AdvanceIndexEmitter {
    mainNode;

    constructor(public id: number, public state: State) {
        this.mainNode = buildPanel(id, state);
        this.addHTMLEvents();

        RootNode.Get().appendChild(this.mainNode);

        this.mainNode.addEventListener(ClosePanelsEvent.type, () => this.onClosePanel());

        this.mainNode.addEventListener(NewMatchesEvent.type,
            (args: any) => this.onNewMatches(args.newCount, args.totalCount));

        this.mainNode.addEventListener(IndexChangeEvent.type,
            (args: any) => this.onIndexChange(args.index));

        this.mainNode.addEventListener(SearchRestartEvent.type, () => this.onSearchRestart());

        if (state.IsEmpty())
            (this.mainNode.querySelector(`.searchInput`) as HTMLInputElement)?.focus();
    }

    //#region Events
    emitClosePanel() { this.mainNode.dispatchEvent(new ClosePanelsEvent(this.id)); }
    onClosePanel() {
        this.mainNode.remove();
        if (Panel.lastFocusedPanel == this.mainNode)
            Panel.lastFocusedPanel = undefined;

        if (this.IsFocused())
            Panel.NextFocus();
    }

    onNewMatches(_: number, totalCount: number) { this.setTotalLabel(totalCount); }

    onIndexChange(index: number) { this.setSelectedLabel(index + 1); }

    emitSearchRestart() { this.mainNode.dispatchEvent(new SearchRestartEvent()); }
    onSearchRestart() {
        this.setSelectedLabel(0);
        this.setTotalLabel(0);
    }

    emitColorChange(colorIndex: number) {
        this.mainNode.dispatchEvent(new ColorChangeEvent(colorIndex));
    }

    emitAdvanceIndex(forward: boolean) {
        this.mainNode.dispatchEvent(new AdvanceIndexEvent(forward));
    }

    addHTMLEvents() {
        const mainNode = this.mainNode, state = this.state, id = this.id;

        mainNode.querySelector(`.colorButton`)?.addEventListener("click", () => {
            state.NextColor();
            mainNode.setAttribute("style", GetPanelColorCSS(state.colorIndex));
            this.emitColorChange(state.colorIndex)
        });

        mainNode.querySelector(`.refreshButton`)?.addEventListener("click",
            () => this.emitSearchRestart());

        mainNode.querySelector(`.downButton`)?.addEventListener("click",
            () => this.emitAdvanceIndex(true));

        mainNode.querySelector(`.upButton`)?.addEventListener("click",
            () => this.emitAdvanceIndex(false));

        mainNode.querySelector(`.closeButton`)?.addEventListener("click",
            () => this.emitClosePanel());


        mainNode.querySelector(`.caseCheck`)?.addEventListener("input", (args) => {
            if (state.caseSensitive == (args?.target as HTMLInputElement)?.checked)
                return;
            state.caseSensitive = (args?.target as HTMLInputElement)?.checked;
            this.emitSearchRestart();
        });

        mainNode.querySelector(`.wordCheck`)?.addEventListener("input", (args) => {
            if (state.wholeWord == (args?.target as HTMLInputElement)?.checked)
                return;

            state.wholeWord = (args.target as HTMLInputElement).checked;
            this.emitSearchRestart();
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
                this.emitSearchRestart();
            }
        });

        searchInput?.addEventListener("keydown", (event: any) => {
            if (event.key === "Enter")
                this.emitAdvanceIndex(true);
            else if (event.key === "Escape")
                this.emitClosePanel();
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
    }
    //#endregion

    totalMatchesLabel?: HTMLElement;
    private setTotalLabel(count: number) {
        if (!this.totalMatchesLabel)
            this.totalMatchesLabel = this.mainNode.querySelector('.totalMatches') as HTMLElement;
        if (this.totalMatchesLabel)
            this.totalMatchesLabel.textContent = count.toString();
    }
    selectedMatchLabel?: HTMLElement;
    private setSelectedLabel(count: number) {
        if (!this.selectedMatchLabel)
            this.selectedMatchLabel = this.mainNode.querySelector('.selectedMatch') as HTMLElement;
        if (this.selectedMatchLabel)
            this.selectedMatchLabel.textContent = count.toString();
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