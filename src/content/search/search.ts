import { DOMCrawler } from './domCrawling/domCrawler';
import { Highlighter } from './rendering/highlighter';
import { Panel } from './panel';
import { State } from './state';
import { RootNode, OptionsChangeEvent } from './rootNode';
import { Match } from './match';
import { Styler } from './cssStyling/styler';
//Nexus class for UI Panel, DOMCrawler and Highlighter:
//Panel holds and controls UI for the search, top element is used to dispatch events
//DOMCrawler goes through DOM tree of the document and sends all matches to Highlighter
//Highlighter takes matches and creates html elements around them

export class Search {
    
    public panel: Panel;
    constructor(public id: number, public state: State, options: any = undefined) {
        this.panel = new Panel(id, state);
        this.addEvents(this.panel.GetEventRoot());
        new Styler(id, this.panel.GetEventRoot(), state.colorIndex, options?.highlightAlpha);
        if (!this.state.IsEmpty())
            this.start();
    }
    
    Close() {
        this.panel.GetEventRoot().dispatchEvent(new ClosePanelsEvent(this.id));
    }

    private dontAccentNewMatches: boolean = false;
    Restart() {
        this.dontAccentNewMatches = this.selectedIndex != undefined && this.selectedIndex > 0;
        this.start();
    }

    public static Options: any;
    static SetOptions(options: any) {
        Search.Options = options;
        RootNode.Get().dispatchEvent(new OptionsChangeEvent(options));
    }
    static NextFocus() {
        Panel.NextFocus();
    }

    addEvents(element: Element) {
        element.addEventListener(IndexChangeEvent.type, (args: any) => this.updateIndex(args.change));

        element.addEventListener(SearchRestartEvent.type, () => this.Restart());

        element.addEventListener(NewMatchesEvent.type, () => this.updateIndex());

        element.addEventListener(
            ClosePanelsEvent.type,
            () => this.clearPreviousSearch());
    }

    private domCrawler?: DOMCrawler;
    private highlighter?: Highlighter;
    start() {
        this.clearPreviousSearch();

        if (!this.state.IsEmpty()) {
            this.highlighter = this.highlighter || new Highlighter(this.id, this.panel.GetEventRoot());

            this.domCrawler = new DOMCrawler(
                this.state.searchString,
                this.state.GetRegex(true),
                this.panel.GetEventRoot(),
                (matches: Match[]) => this.highlighter!.QueMatches(matches));
        }
        this.updateIndex();
    }

    clearPreviousSearch() {
        this.domCrawler?.Interrupt();
        this.domCrawler = undefined;
        this.highlighter?.Clear();
        this.selectedIndex = undefined;
    }

    //TODO: change from javascript null logic
    selectedIndex?: number;
    updateIndex(indexChange = 0) {
        //if index isn't being incremented and selectedIndex is either null or 0, get new Index
        if (!indexChange && !this.selectedIndex)
            this.selectedIndex = this.highlighter?.GetNewIndex();

        const matchCount = this.highlighter?.GetMatchcount() || 0;
        this.selectedIndex = normalizeSearchIndex(this.selectedIndex|| 0, indexChange, matchCount);

        if (this.selectedIndex) {
            const scrollTowardsMatch = !this.dontAccentNewMatches || Math.abs(indexChange) > 0;
            this.highlighter?.AccentMatch(this.selectedIndex, scrollTowardsMatch);
        }

        this.panel.updateLabels(this.selectedIndex as number, matchCount);
    }
}

Search.Options = undefined;

function normalizeSearchIndex(current: number, change: number, matchCount: number) {
    if (matchCount <= 0)
        return;
    current = (current || 0) + (change || 0);
    if (current < 0)
        current = matchCount - 1;
    else if (current >= matchCount)
        current = 0;
    return current;
}

export class ClosePanelsEvent extends Event {
    static readonly type: string = "fm-search-close";
    constructor(public id: number) {
        super(ClosePanelsEvent.type, { bubbles: true });
    }
}

export class NewMatchesEvent extends Event {
    static readonly type: string = "fm-new-matches";
    constructor(public count: number) {
        super(NewMatchesEvent.type);
    }
}

export class IndexChangeEvent extends Event {
    static readonly type: string = "fm-index-change";
    constructor(public change: number) {
        super(IndexChangeEvent.type);
    }
}

export class SearchRestartEvent extends Event {
    static readonly type: string = "fm-search-restart";
    constructor() {
        super(SearchRestartEvent.type);
    }
}
