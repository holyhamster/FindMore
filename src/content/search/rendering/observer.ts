import { PerformanceTimer } from "../performanceTimer";
import { Container } from "./container";
import { AnchoredMatch } from "./anchoredMatch";
import { GetSafeElement, Match } from "../domCrawling/match";
import { IndexMatches, IndexedMatch } from "./indexedMatch";
import { HighlightedMatch } from "./highlightedMatch";
import { ContainerRemoval } from "./containerRemoval";
import {
    ClosePanelListener, ClosePanelsEvent, IndexChangeEvent,
    IndexChangeListener, NewMatchesEmitter, NewMatchesEvent,
    SearchRestartEvent, SearchRestartListener
} from "../searchEvents";

//Wrapper around IntersectionObserver.
//Que()s matches, observe Element above them, on observe processes them into HighlightMatches
//HighlightMatches are created in stages to optimize browser's reflow calls:
// - Take observed parent elements, if its visible then create container for its matches
// - Append all containers to the document
// - Calculate highlight rectangles for each match
// - Append rectangles to the containers
// - Trigger removal of old containers (so it happens before the redraw)
export class Observer implements IndexChangeListener, SearchRestartListener,
    ClosePanelListener, NewMatchesEmitter    {

    private observer: IntersectionObserver;
    private containerMap: Map<Element, Container> = new Map();
    public IndexMap: Map<number, HighlightedMatch> = new Map();

    constructor(
        private eventRoot: Element,
        private searchId: number) {

        eventRoot.addEventListener(ClosePanelsEvent.type, () => this.onClosePanel());
        eventRoot.addEventListener(SearchRestartEvent.type, () => this.onSearchRestart());
        eventRoot.addEventListener(IndexChangeEvent.type,
            (args: any) => this.onIndexChange(args.index));
        
        this.observer = new IntersectionObserver((entries) => this.onObserve(entries));
    }

    //Find an anchor element for  each match,
    //group it for processing with other under the same parent Element
    private quedMatches: Map<Element, AnchoredMatch[]> = new Map();
    public Que(matches: Match[]) {
        matches.forEach((match) => {
            const anchor = GetSafeElement(match);
            if (!anchor)
                return;
            const anchoredMatch = match as AnchoredMatch;
            anchoredMatch.anchor = anchor;
            const parent = anchor.parentElement;

            const matchesArray = this.quedMatches.get(parent) || [];
            if (!this.quedMatches.has(parent)) {
                this.quedMatches.set(parent, matchesArray);
                this.observer.observe(parent);
            }
            matchesArray.push(anchoredMatch);
        });
    }

    // #region events
    private accentedIndex: number | undefined;
    onIndexChange(index: number) {
        if (this.accentedIndex)
            this.IndexMap.get(this.accentedIndex)?.SetAccent(false);
        this.accentedIndex = index;
        this.IndexMap.get(this.accentedIndex)?.SetAccent(true);
    }

    onClosePanel() { this.clear(); }

    onSearchRestart() { this.clear(); }

    emitNewMatches(newCount: number, totalCount: number) {
        this.eventRoot.dispatchEvent(new NewMatchesEvent(newCount, totalCount));
    }
    //#endregion

    //triggered by IntersectionObserver, converts qued Matches into HighlightMatches 
    //reobserves elements if timer is exceeded
    private onObserve(entries: IntersectionObserverEntry[]) {
        const timer = new PerformanceTimer();
        const containers: Container[] = [];
        let startingIndex = this.IndexMap.size;
        entries.forEach((entry: IntersectionObserverEntry) => {
            const parent = entry.target;
            this.observer.unobserve(parent);

            if (!timer.IsUnder(observerMSLimit)) {
                this.observer.observe(parent);
                return;
            }

            const matches = this.quedMatches.get(parent);
            this.quedMatches.delete(parent);

            if (!matches || matches.length == 0 || !entryIsVisible(entry))
                return;

            const indexedMatches = IndexMatches(matches, startingIndex);
            startingIndex += indexedMatches.length;

            const container = wrapMatchesInContainer(
                indexedMatches, this.containerMap, this.searchId);
            if (container)
                containers.push(container);
        });

        containers.forEach((container) => container.AppendSelf());

        const range = document.createRange();
        containers.forEach((container) => container.CalculateRectangles(range));

        const oldSize = this.IndexMap.size;
        containers.forEach((container) => 
            container.AppendCalculated().forEach((match: HighlightedMatch) => 
                this.IndexMap.set(match.index, match)));

        this.emitNewMatches(this.IndexMap.size - oldSize, this.IndexMap.size);
        ContainerRemoval.Trigger();
    }

    private clear() {
        this.observer.disconnect();
        this.quedMatches.clear();
        this.IndexMap.clear();
        ContainerRemoval.Que(Array.from(this.containerMap.values()));
        this.containerMap.clear();
    }
}

//groups matches to the container according to the elements above them
function wrapMatchesInContainer(indexedMatches: IndexedMatch[],
    containerMapRef: Map<Element, Container>, searchId: number) {
    if (indexedMatches.length == 0)
        return undefined;
    const parent = indexedMatches[0].anchor.parentElement;
    let container = containerMapRef.get(parent);
    if (!container) {
        container = new Container(indexedMatches![0].anchor, searchId);
        containerMapRef.set(parent, container);
    }
    container.AddMatches(indexedMatches);

    return container;
}

function entryIsVisible(entry: IntersectionObserverEntry) {
    const parentStyle = window.getComputedStyle(entry.target);
    return entry.boundingClientRect.width > 1 && entry.boundingClientRect.height > 1 &&
        parentStyle.visibility !== 'hidden' && parentStyle.display !== 'none';
}

//limit for a single cycle
const observerMSLimit = 300;