import { DomSearcher } from './DOMSearch/domSearcher.js';
import { Highlighter } from './DOMSearch/highlighter.js';
import { Panel } from './panel.js';
import { Root, GetOptionsChangeEvent } from './root.js';

//Nexus class for UI Panel, DOMSearcher and Highlighter:
//Panel holds and controls UI for the search, top element is used to dispatch events
//DOMSearcher goes through DOM tree of the document and sends all matches to Highlighter
//Highlighter takes matches and creates html elements to mark them

export class Search {
    constructor(id, state, options) {
        this.id = id;
        this.State = state;

        const panel = new Panel(id, state, options);
        this.panel = panel;

        this.addSearchListeners(panel.GetLocalRoot());

        if (!this.State.IsEmpty())
            this.startDomSearch();
    }

    Close() {
        this.panel.GetLocalRoot().dispatchEvent(GetClosePanelsEvent(this.id));
    }

    static SetOptions(options) {
        Root.Get().dispatchEvent(GetOptionsChangeEvent(options));
    }

    addSearchListeners(element) {
        element.addEventListener(
            GetChangeIndexEvent().type,
            (args) => this.changeIndex(args.change));

        element.addEventListener(
            GetSearchRestartEvent().type,
            () => this.restartSearch());

        element.addEventListener(
            GetNewMatchesEvent().type,
            () => this.changeIndex());

        element.addEventListener(
            GetClosePanelsEvent().type,
            () => this.clearPreviousSearch());
    }

    domSearcher;
    highlighter;
    startDomSearch() {
        this.clearPreviousSearch();

        if (!this.State.IsEmpty()) {
            this.highlighter = this.highlighter || new Highlighter(this.id, this.panel.GetLocalRoot());

            this.domSearcher = new DomSearcher(
                this.State.searchString, this.State.GetRegex(true), this.panel.GetLocalRoot(), this.highlighter);
        }
        this.changeIndex();
    }

    clearPreviousSearch() {
        this.secondatySearch = true;
        this.domSearcher?.Interrupt();
        this.domSearcher = null;
        this.highlighter?.Clear();
        this.selectedIndex = null;
    }

    selectedIndex;
    changeIndex(indexChange) {
        //if index isn't being incremented and selectedIndex is either null or 0, get new Index
        if (!indexChange && !this.selectedIndex)
            this.selectedIndex = this.highlighter?.GetNewIndex();

        const matchCount = this.highlighter?.getMatchCount() || 0;
        this.selectedIndex = normalizeSearchIndex(this.selectedIndex, indexChange, matchCount);

        if (!isNaN(this.selectedIndex)) {
            const scrollTowardsMatch = !this.dontAccentNewMatches || Math.abs(indexChange) > 0;
            this.highlighter?.accentMatch(this.selectedIndex, scrollTowardsMatch);
        }

        this.panel.updateLabels(this.selectedIndex, matchCount);
    }

    restartSearch() {
        this.dontAccentNewMatches = this.selectedIndex > 0;
        this.startDomSearch();
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