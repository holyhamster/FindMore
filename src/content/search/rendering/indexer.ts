import { Container } from "./container";
import { Match } from "../match";
import { IndexedMatch } from "./indexedMatch";
import {
    AdvanceIndexEvent, AdvanceIndexListener,
    NewMatchesEvent, NewMatchesListener,
    IndexChangeEvent, IndexChangeEmitter, IndexChangeListener,
    SearchRestartEvent, SearchRestartListener
} from "../searchEvents";


export class Indexer implements IndexChangeEmitter, IndexChangeListener,
    AdvanceIndexListener, NewMatchesListener, SearchRestartListener {

    private scrollObserver: IntersectionObserver;

    constructor(
        private eventElement: Element,
        private indexToContainer: Map<number, Container>,
        private scrollToFirstMatch = false) {

        this.scrollObserver = getScrollObserver();

        eventElement.addEventListener(AdvanceIndexEvent.type,
            (args: any) => this.onAdvanceIndex(args.forward));

        eventElement.addEventListener(IndexChangeEvent.type,
            (args: any) => this.onIndexChange(args.index));

        eventElement.addEventListener(NewMatchesEvent.type,
            (args: any) => this.onNewMatches(args.newCount, args.totalCount));

        eventElement.addEventListener(SearchRestartEvent.type, () => this.onSearchRestart());
    }
    //#region Events
    private currentMatch: IndexedMatch | undefined;
    private pastMatch: IndexedMatch | undefined;

    onIndexChange(index: number) {
        const newMatch = this.indexToContainer.get(index)?.GetMatch(index);
        
        if (!newMatch)
            return;
        this.currentMatch = newMatch;
        if (index != 0)
            this.pastMatch = undefined;
        this.changeAccent(this.currentMatch.index!, this.scrollToFirstMatch);
        this.scrollToFirstMatch = true;
    }

    onNewMatches(newCount: number, totalCount: number) {
        if (this.currentMatch && this.currentMatch.index > 0)
            return;

        if (this.pastMatch == undefined) {
            if (this.currentMatch == undefined && totalCount > 0)
                this.emitIndexChange(0);
            return;
        }

        let newMatches: IndexedMatch[] = [];
        for (let i = totalCount - newCount; i < totalCount; i++) {
            const newMatch = this.indexToContainer.get(i)?.GetMatch(i);
            if (newMatch)
                newMatches.push(newMatch);
        }

        const newIndex = IndexedMatch.FindIndexOfClosest(newMatches, this.pastMatch);

        if (typeof newIndex == "number")
            this.emitIndexChange(newIndex);
        else if (this.currentMatch == undefined)
            this.emitIndexChange(0);
    }

    onAdvanceIndex(forward: boolean) {
        const total = this.indexToContainer.size;
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
        if (this.currentMatch)
            this.pastMatch = this.currentMatch;
        this.currentMatch = undefined;
        this.changeAccent(undefined, false);
    }

    emitIndexChange(index: number) {
        this.eventElement.dispatchEvent(new IndexChangeEvent(index));
    }
    //#endregion

    private accentedIndex: number | undefined;
    private changeAccent(index: number | undefined, scrollTowards: boolean) {
        if (this.accentedIndex) {
            const oldAccentContainer = this.indexToContainer.get(this.accentedIndex);
            oldAccentContainer?.SetAccent(false);
            this.accentedIndex = undefined;
        }
        if (index == undefined)
            return;
        const accentContainer = this.indexToContainer.get(index);
        if (!accentContainer)
            return;
        this.accentedIndex = index;
        accentContainer.SetAccent(this.accentedIndex);
        if (scrollTowards)
            this.scrollObserver.observe(accentContainer.headElement);
    }
}

//observer that scrolls towards if the element is outside viewpoint
function getScrollObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            observer.unobserve(entry.target);
            if (!entry.isIntersecting)
                entry.target.scrollIntoView({ block: "center" });
        });
    });
    return observer;
}