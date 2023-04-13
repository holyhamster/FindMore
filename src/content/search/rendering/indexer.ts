import { Container } from "./container";
import { Match } from "../match";
import {
    AdvanceIndexEvent, AdvanceIndexListener,
    NewMatchesEvent, NewMatchesListener,
    IndexChangeEvent, IndexChangeEmitter, IndexChangeListener,
    SearchRestartEvent, SearchRestartListener
} from "../searchEvents";

export class Indexer implements IndexChangeEmitter, IndexChangeListener,
    AdvanceIndexListener, NewMatchesListener, SearchRestartListener{

    private currentIndex: number | undefined;
    private pastMatch: Match | undefined;
    private scrollObserver: IntersectionObserver;
    constructor(
        private indexToContainer: Map<number, Container>,
        private eventElement: Element,
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
    onIndexChange(index: number) {
        if (index < 0 || index >= this.indexToContainer.size)
            return;
        this.currentIndex = index;
        this.pastMatch = undefined;
        this.changeAccent(this.currentIndex, this.scrollToFirstMatch);
        if (!this.scrollToFirstMatch)
            this.scrollToFirstMatch = true;
    }

    onNewMatches(newCount: number, totalCount: number) {

        if (this.pastMatch != undefined) {
            let newMatches: Match[] = [];
            for (let i = totalCount - newCount; i < totalCount; i++) {
                const newMatch = this.indexToContainer.get(i)?.GetMatch(i);
                if (newMatch)
                    newMatches.push(newMatch);
            }
            this.currentIndex = Match.FindIndexOfClosest(newMatches, this.pastMatch);
            if (!this.currentIndex)
                return;
        }
        else
            this.currentIndex = 0;
        this.emitIndexChange(this.currentIndex);
    }

    onAdvanceIndex(forward: boolean) {
        const total = this.indexToContainer.size;
        if (total == 0)
            return;

        let newIndex = (this.currentIndex || 0) + (forward ? 1 : -1);

        if (newIndex < 0)
            newIndex = total - 1;
        else if (newIndex >= total)
            newIndex = 0;
        if (this.currentIndex != newIndex)
            this.emitIndexChange(newIndex);
    }

    onSearchRestart() {
        if (this.currentIndex && this.currentIndex > 0) {
            this.pastMatch =
                this.indexToContainer.get(this.currentIndex)?.GetMatch(this.currentIndex);
        }
        this.currentIndex = undefined;
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
            if (oldAccentContainer) {
                oldAccentContainer.SetAccent(this.accentedIndex, false);
                this.accentedIndex = undefined;
            }
        }

        if (index == undefined || index < 0 || index >= this.indexToContainer.size)
            return;

        const accentTarget = this.indexToContainer.get(index);
        if (!accentTarget)
            return;

        this.accentedIndex = index;
        accentTarget.SetAccent(this.accentedIndex, true);
        this.scrollObserver = this.scrollObserver || getScrollObserver();
        if (scrollTowards && accentTarget?.headElement)
            this.scrollObserver.observe(accentTarget.headElement as Element);
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