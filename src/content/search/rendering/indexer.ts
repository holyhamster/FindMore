import { HighlightedMatch } from "./highlightedMatch";
import { FindIndexOfClosest } from "../domCrawling/match";
import {
    AdvanceIndexEvent, AdvanceIndexListener,
    NewMatchesEvent, NewMatchesListener,
    IndexChangeEvent, IndexChangeEmitter, IndexChangeListener,
    SearchRestartEvent, SearchRestartListener
} from "../searchEvents";

//changes selected match highlight according to events
export class Indexer implements AdvanceIndexListener, NewMatchesListener,
    SearchRestartListener, IndexChangeEmitter, IndexChangeListener {

    constructor(
        private eventElement: Element,
        private indexMapRef: Map<number, HighlightedMatch>,
        scrollToFirstMatch = false) {
        this.scroll = scrollToFirstMatch;

        eventElement.addEventListener(AdvanceIndexEvent.type,
            (args: any) => this.onAdvanceIndex(args.forward));

        eventElement.addEventListener(IndexChangeEvent.type,
            (args: any) => this.onIndexChange(args.index));

        eventElement.addEventListener(NewMatchesEvent.type,
            (args: any) => this.onNewMatches(args.newCount, args.totalCount));

        eventElement.addEventListener(SearchRestartEvent.type, () => this.onSearchRestart());
    }
    private scrollObserver: IntersectionObserver = getScrollObserver();

    //#region Events
    private currentMatch: HighlightedMatch | undefined;
    //match from previous search is used to find a new one near it
    private pastMatch: HighlightedMatch | undefined;    
    private scroll: boolean;
    onIndexChange(index: number) {
        const newMatch = this.indexMapRef.get(index);
        if (!newMatch)
            return;
        //if index is moved by user beyond 0, forget past match
        if (index != 0)
            this.pastMatch = undefined;

        if (this.scroll && newMatch.elements.length > 0) 
            this.scrollObserver.observe(newMatch.elements[0]);
        this.scroll = true;
        this.currentMatch = newMatch;
    }

    //If pastMatch exists, see if a new match exists near it
    //if current match is undefinied, select 0
    onNewMatches(newCount: number, totalCount: number) {
        if (this.currentMatch && this.currentMatch.index > 0)
            return;

        if (this.pastMatch != undefined) {
            const newMatches: HighlightedMatch[] = [];
            for (let i = totalCount - newCount; i < totalCount; i++) {
                const newMatch = this.indexMapRef.get(i);
                if (newMatch)
                    newMatches.push(newMatch);
            }
            const newMatchNearPastOne = FindIndexOfClosest(newMatches, this.pastMatch);
            if (typeof newMatchNearPastOne == "number") {
                this.emitIndexChange(newMatchNearPastOne);
                return;
            }
        }

        if (this.currentMatch == undefined && totalCount > 0)
            this.emitIndexChange(0);
    }

    //move index forward or backwards, wrap it around if necessary 
    onAdvanceIndex(forward: boolean) {
        const total = this.indexMapRef.size;
        if (total == 0)
            return;

        let newIndex = (this.currentMatch?.index || 0) + (forward ? 1 : -1);
        if (newIndex < 0)
            newIndex = total - 1;
        else if (newIndex >= total)
            newIndex = 0;
        if (this.currentMatch?.index != newIndex)
            this.emitIndexChange(newIndex);
    }

    onSearchRestart() {
        this.pastMatch = this.currentMatch;
        this.currentMatch = undefined;
    }

    emitIndexChange(index: number) {
        this.eventElement.dispatchEvent(new IndexChangeEvent(index));
    }
    //#endregion
}

//observer that scrolls towards if the element is outside viewpoint
function getScrollObserver() {
    const observer = new IntersectionObserver((entries) => 
        entries.forEach((entry) => {
            observer.unobserve(entry.target);
            if (!entry.isIntersecting)
                entry.target.scrollIntoView({ block: "center" });
        }));
    return observer;
}