import DOMSearcher from './DOMSearch/domSearcher.js';
import Highlighter from './DOMSearch/highlighter.js';
import { Panel } from './panel.js';
import { Shadowroot } from './shadowroot.js';

//creates and controls search panel element
//starts the search with DOMSearcher, marks results with Highlighter and sets css with Styler
export class Search {
    constructor(id, state, options) {
        this.id = id;
        this.state = state;

        const panel = new Panel(id, state, options);
        this.panel = panel;

        const localUpdateElement = panel.GetLocalRoot();

        localUpdateElement.addEventListener(
            GetChangeIndexEvent().type,
            (args) => { this.changeIndex(args.change); });

        localUpdateElement.addEventListener(
            GetSearchRestartEvent().type,
            () => { this.restartSearch(); });

        localUpdateElement.addEventListener(
            GetNewMatchesEvent().type,
            (args) => { this.changeIndex(args?.change); });

        localUpdateElement.addEventListener(
            GetClosePanelsEvent().type,
            (args) => {
                if (args.id == this.id)
                    this.clearPreviousSearch();
            });

        if (this.state.searchString != "")
            this.startDomSearch();
    }

    domSearcher;
    highlighter;
    startDomSearch() {
        this.clearPreviousSearch();

        if (this.state.searchString != "") {
            this.highlighter = this.highlighter ||
                new Highlighter(this.id, this.panel.GetLocalRoot());

            this.domSearcher = new DOMSearcher(
                this.state.searchString, this.state.getRegex(true),
                this.panel.GetLocalRoot(), this.highlighter);
        }
        this.changeIndex();
    }

    clearPreviousSearch() {
        this.domSearcher?.interrupt();
        this.domSearcher = null;
        this.highlighter?.clearSelection();
    }

    selectedIndex;
    changeIndex(indexChange) {
        const matchesLength = this.highlighter?.getMatchCount() || 0;

        if (this.selectedIndex == null)
            this.selectedIndex = this.highlighter?.getNewClosestMatch();
        else
            this.selectedIndex = normalizeSearchIndex(this.selectedIndex, indexChange, matchesLength);

        if (!isNaN(this.selectedIndex))
            this.highlighter?.accentMatch(this.selectedIndex);

        this.panel.updateLabels(this.selectedIndex, matchesLength);
    }

    restartSearch() {
        this.selectedIndex = null;
        this.changeIndex();
        this.startDomSearch();
    }

    Close() {
        this.panel.GetLocalRoot().dispatchEvent(GetClosePanelsEvent(this.id));
    }

    static SetOptions(options) {
        Shadowroot.Get().dispatchEvent(GetOptionsChangeEvent(options));
    }
}

function normalizeSearchIndex(current, change, matchCount) {
    if (matchCount <= 0)
        return;

    current = (current || 0) + (change || 0);

    if (current < 0)
        current = matchCount - 1;
    else if (current >= matchCount)
        current = 0;

    return current;
}

//#region EVENTS
export function GetClosePanelsEvent(id) {
    const event = new Event("fm-search-close", { bubbles: true });
    event.id = id;
    return event;
}
export function GetNewMatchesEvent(count) {
    const event = new Event("fm-matches-new");
    event.count = count;
    return event;
}
export function GetOptionsChangeEvent(options) {
    const event = new Event("fm-options-change");
    event.options = options;
    return event;
}
export function GetChangeIndexEvent(change) {
    const event = new Event("fm-index-change");
    event.change = change;
    return event;
}
export function GetSearchRestartEvent() {
    const event = new Event("fm-search-restart");
    return event;
}
export function GetStateChangeEvent() {
    const event = new Event("fm-state-change", { bubbles: true });
    return event;
}
//#endregion