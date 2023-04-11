import { Match } from "../match";
import { Highlight } from "./highlight";

//Holds all highlight rectangles for matches under a single parent element in DOM tree
//Creating a highlight is split into stages to be done in batches to minimize browser reflow calls:
//QueMatch() -> 
//IndexNextMatch() -> 
//AppendSelf() -> 
//PrecalculateRectangles() -> 
//AppendPrecalculated()

export class Container {
    headElement: Element;
    constructor(
        public parentNode: Element,
        private targetNode: Node,
        private id: number) {
        this.headElement = document.createElement('FM-CONTAINER');
    }

    SetAccent(matchIndex: number, accentState: boolean) {
        if (isNaN(matchIndex))
            return;

        const elements = Array.from(this.headElement.getElementsByClassName(`fm-${this.id}-${matchIndex}`));

        elements.forEach((span: Element) => {
            if (accentState)
                span.classList.add(`fm-accented`);
            else
                span.classList.remove(`fm-accented`);
        });

        return elements;
    }

    quedMatches: Match[] = [];
    QueMatch(match: Match) {
        this.quedMatches.push(match);
    }

    indexedMatches: IndexedMatch[] = [];
    IndexNextMatch(newIndex: number) {
        if (this.quedMatches.length == 0)
            return false;

        const match = this.quedMatches.shift() as IndexedMatch;
        match.index = newIndex;
        this.indexedMatches.push(match);
        return true;
    }

    precalculatedNodes: Highlight[] = [];
    PrecalculateRectangles(range: Range) {
        const anchor = this.headElement.getBoundingClientRect();
        while (this.indexedMatches.length > 0) {
            const match = this.indexedMatches.shift()!;

            const elements: Highlight[] = [];
            match.GetRectangles(range).forEach((rect) =>
                elements.push(Highlight.build(rect, anchor, this.id, match.index)));

            this.precalculatedNodes = [...this.precalculatedNodes, ...elements];
        }
    }

    AppendPrecalculated() {
        //with many append operations it can be profitable to temporarily unappend parent element 
        const HEAVY_CONTAINER = this.precalculatedNodes.length > 2;
        if (HEAVY_CONTAINER)
            this.headElement.remove();

        while (this.precalculatedNodes.length > 0)
            this.headElement.append(this.precalculatedNodes.shift()!);

        if (HEAVY_CONTAINER)
            this.AppendSelf();
    }

    public AppendSelf() {
        this.parentNode.insertBefore(this.headElement, this.targetNode.nextSibling);
    }

    public GetMatch(index: number) {
        this.GetAllMatches().forEach(
            (match: IndexedMatch) => {
                if (match.index == index) return match;
            })
        return undefined;
    }

    public GetAllMatches() {
        return Array.from(this.indexedMatches);
    }

    public Remove() {
        this.headElement.remove();
        this.ClearCache();
    }

    private ClearCache() {
        this.quedMatches = [];
        this.precalculatedNodes = [];
    }
}

interface IndexedMatch extends Match {
    index: number;
}