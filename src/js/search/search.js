import { DOMCrawler } from './domCrawling/domCrawler.js';
import { Highlighter } from './rendering/highlighter.js';
import { Panel } from './panel.js';
import { RootNode, GetOptionsChangeEvent } from './rootNode.js';

//Nexus class for UI Panel, DOMCrawler and Highlighter:
//Panel holds and controls UI for the search, top element is used to dispatch events
//DOMCrawler goes through DOM tree of the document and sends all matches to Highlighter
//Highlighter takes matches and creates html elements to mark them

export class Search {
    constructor(id, state, options) {
        this.id = id;
        this.State = state;

        this.panel = new Panel(id, state, options);

        this.addEvents(this.panel.GetEventRoot());

        if (!this.State.IsEmpty())
            this.startDOMCrawl();
    }

    Close() {
        this.panel.GetEventRoot().dispatchEvent(GetClosePanelsEvent(this.id));
    }

    Restart() {
        this.dontAccentNewMatches = this.selectedIndex > 0;
        this.startDOMCrawl();
    }

    static SetOptions(options) {
        Search.Options = options;
        RootNode.Get().dispatchEvent(GetOptionsChangeEvent(options));
    }
    static NextFocus() {
        Panel.NextFocus();
    }

    addEvents(element) {
        element.addEventListener(
            GetChangeIndexEvent().type,
            (args) => this.changeIndex(args.change));

        element.addEventListener(
            GetSearchRestartEvent().type,
            () => this.Restart());

        element.addEventListener(
            GetNewMatchesEvent().type,
            () => this.changeIndex());

        element.addEventListener(
            GetClosePanelsEvent().type,
            () => this.clearPreviousSearch());
    }

    domCrawler;
    highlighter;
    startDOMCrawl() {
        this.clearPreviousSearch();

        if (!this.State.IsEmpty()) {
            this.highlighter = this.highlighter || new Highlighter(this.id, this.panel.GetEventRoot());

            this.domCrawler = new DOMCrawler(
                this.State.searchString, this.State.GetRegex(true), this.panel.GetEventRoot(), this.highlighter);
        }
        this.changeIndex();
    }

    clearPreviousSearch() {
        this.secondatySearch = true;
        this.domCrawler?.Interrupt();
        this.domCrawler = null;
        this.highlighter?.Clear();
        this.selectedIndex = null;
    }

    selectedIndex;
    changeIndex(indexChange) {
        //if index isn't being incremented and selectedIndex is either null or 0, get new Index
        if (!indexChange && !this.selectedIndex)
            this.selectedIndex = this.highlighter?.GetNewIndex();

        const matchCount = this.highlighter?.GetMatchcount() || 0;
        this.selectedIndex = normalizeSearchIndex(this.selectedIndex, indexChange, matchCount);

        if (!isNaN(this.selectedIndex)) {
            const scrollTowardsMatch = !this.dontAccentNewMatches || Math.abs(indexChange) > 0;
            this.highlighter?.AccentMatch(this.selectedIndex, scrollTowardsMatch);
        }

        this.panel.updateLabels(this.selectedIndex, matchCount);
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
    const event = new Event("fm-new-matches");
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
