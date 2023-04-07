//Holds all highlight rectangles for matches under a single parent element in DOM tree
//Creating a highlight is split into stages to be done in batches to minimize browser reflow calls:
//QueMatch() -> 
//IndexNextMatch() -> 
//AppendSelf() -> 
//PrecalculateRectangles() -> 
//AppendPrecalculated()

import { Match } from "../match";

export class Container {
    headElement: Element;
    constructor(public parentNode: Element, private targetNode: Node, private id: number) {
        this.headElement = document.createElement('FM-CONTAINER');
    }

    SetAccent(matchIndex: number, accentState: boolean) {
        if (isNaN(matchIndex))
            return;

        const elements = Array.from(this.headElement.getElementsByClassName(`fm-${this.id}-${matchIndex}`));

        elements.forEach((span) => {
            if (accentState)
                span.classList.add(`fm-accented`);
            else
                span.classList.remove(`fm-accented`);
        });

        return elements;
    }

    AppendSelf() {
        this.parentNode.insertBefore(this.headElement, this.targetNode.nextSibling);
    }

    quedMatches: Match[] = [];
    QueMatch(match: Match) {
        this.quedMatches.push(match);
    }

    indexedMatches: IndexedMatch[] = [];

    IndexNextMatch(newIndex: number) {
        if (this.quedMatches.length == 0)
            return;

        const match = this.quedMatches.shift() as IndexedMatch;
        match.index = newIndex;
        this.indexedMatches.push(match);
        return true;
    }

    precalculatedNodes: Element[] = [];
    PrecalculateRectangles(range: Range) {
        const anchor = this.headElement.getBoundingClientRect();
        while (this.indexedMatches.length > 0) {
            const match = this.indexedMatches.shift()!;

            const elements: Element[] = [];
            match.GetRectangles(range).forEach((rect) => {
                const rectElement = document.createElement('FM-HIGHLIGHT');
                rectElement.classList.add(`fm-${this.id}`, `fm-${this.id}-${match.index}`);
                rectElement.style.height = rect.height + 'px';
                rectElement.style.width = rect.width + 'px';
                rectElement.style.left = rect.left - anchor.x + 'px';
                rectElement.style.top = rect.top - anchor.y + 'px';
                elements.push(rectElement);
            });

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

    GetMatch(index: number) {
        this.indexedMatches.forEach(
            (match: IndexedMatch) => {
                if (match.index == index) return match;
            })
        return undefined;
    }

    GetAllMatches() {
        return Array.from(this.indexedMatches);
    }

    Remove() {
        this.headElement.remove();
        this.ClearCache();
    }

    ClearCache() {
        this.quedMatches = [];
        this.precalculatedNodes = [];
    }
}

interface IndexedMatch extends Match {
    index: number;
}