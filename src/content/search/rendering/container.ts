import { HighlightedMatch } from "./highlightedMatch";
import { IndexedMatch } from "./indexedMatch";
import { ParentedElement } from "./parentedElement";

//wrapper around an HTML element that parents HighlightedMatches
//Creating a highlight is split into stages to be done in batches to minimize browser reflow calls:
//AddMatches() -> 
//AppendSelf() -> 
//CalculateRectangles() -> 
//AppendCalculated()

export class Container {
    private headElement: Element;
    constructor(
        private targetElement: ParentedElement,
        private searchId: number) {
        this.headElement = document.createElement('FM-CONTAINER');
    }

    private quedMatches: IndexedMatch[] = [];
    public AddMatches(match: IndexedMatch[]) {
        this.quedMatches = [...this.quedMatches, ...match];
    }

    private quedHighlighted: HighlightedMatch[] = [];
    public CalculateRectangles(range: Range) {
        const anchor = this.headElement.getBoundingClientRect();
        this.quedMatches.forEach((match: IndexedMatch) => {
            const newMatch = new HighlightedMatch(match, this.searchId, range, anchor);
            this.quedHighlighted.push(newMatch);
        })
        this.quedMatches = [];
    }

    public AppendCalculated() {
        //if many childs to append, temporarily unappend parent 
        const HEAVY_CONTAINER = this.quedHighlighted.length > 2;

        if (HEAVY_CONTAINER)
            this.headElement.remove();

        this.quedHighlighted.forEach((match: HighlightedMatch) =>
            match.AppendSelf(this.headElement));

        if (HEAVY_CONTAINER)
            this.AppendSelf();

        const newHighlights = this.quedHighlighted;
        this.quedHighlighted = [];
        return newHighlights;
    }

    public AppendSelf() {
        this.targetElement.parentElement.
            insertBefore(this.headElement, this.targetElement?.nextSibling || null);
    }

    public Remove() {
        this.headElement.remove();
    }
}
