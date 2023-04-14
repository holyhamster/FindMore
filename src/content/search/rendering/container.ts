import { Match } from "../match";
import { HighlightedMatch } from "./highlightedMatch";
import { IndexedMatch } from "./indexedMatch";

//Holds all highlight rectangles for matches under a single parent element in DOM tree
//Creating a highlight is split into stages to be done in batches to minimize browser reflow calls:
//QueMatch() -> 
//IndexNextMatch() -> 
//AppendSelf() -> 
//PrecalculateRectangles() -> 
//AppendPrecalculated()

export class Container {
    public headElement: Element;
    public parentElement: Element;
    constructor(private targetElement: ParentedElement, private searchId: number) {
        this.headElement = document.createElement('FM-CONTAINER');
        this.parentElement = targetElement.parentElement;
    }

    private accentedIndex: number | undefined;
    SetAccent(matchIndex: number | false) {
        if (this.accentedIndex != undefined &&
            (this.matchesMap.get(this.accentedIndex) instanceof HighlightedMatch)) {
            (this.matchesMap.get(this.accentedIndex) as HighlightedMatch).SetAccent(false);
        }
        if (typeof matchIndex == "number") {
            this.accentedIndex = matchIndex;
            if (this.matchesMap.get(matchIndex) instanceof HighlightedMatch) {
                
                (this.matchesMap.get(matchIndex) as HighlightedMatch).SetAccent(true);
            }
        }
    }

    quedMatches: Match[] = [];
    QueMatch(match: Match) {
        this.quedMatches.push(match);
    }

    matchesMap: Map<number, IndexedMatch> = new Map<number, IndexedMatch>();
    quedIndexed: IndexedMatch[] = [];
    IndexNewMatches(startIndex: number) {
        let i = 0;

        this.quedMatches.forEach((match: Match) => {
            const newIndex = startIndex + i;
            const indexedMatch = new IndexedMatch(match, newIndex)
            this.matchesMap.set(newIndex, indexedMatch);
            this.quedIndexed.push(indexedMatch);
            i++;
        })
        this.quedMatches = [];
        return i;
    }

    quedHighlighted: HighlightedMatch[] = [];
    PrecalculateRectangles(range: Range) {
        const anchor = this.headElement.getBoundingClientRect();
        this.quedIndexed.forEach((match: IndexedMatch) => {
            const rects = match.GetRectangles(range);
            const newMatch = new HighlightedMatch(match, this.searchId, rects, anchor);
            if (match.index == this.accentedIndex)
                newMatch.SetAccent(true);
            this.matchesMap.set(match.index, newMatch);
            this.quedHighlighted.push(newMatch);
        })
        this.quedIndexed = [];
    }

    AppendPrecalculated() {
        //if many childs to append, temporarily unappend parent 
        const HEAVY_CONTAINER = this.quedHighlighted.length > 2;

        if (HEAVY_CONTAINER)
            this.headElement.remove();

        this.quedHighlighted.forEach((match: HighlightedMatch) =>
            match.AppendSelf(this.headElement));
            
        if (HEAVY_CONTAINER)
            this.AppendSelf();
        this.quedHighlighted = [];
    }

    public AppendSelf() {
        this.targetElement.parentElement?.
            insertBefore(this.headElement, this.targetElement?.nextSibling || null);
    }

    public GetMatch(index: number): IndexedMatch | undefined {
        return this.matchesMap.get(index);
    }

    public GetAllMatches(): IndexedMatch[] {
        return Array.from(this.matchesMap.values());
    }

    public Remove() {
        this.headElement.remove();
        this.ClearCache();
    }

    private ClearCache() {
        this.quedMatches = [];
        this.quedHighlighted = [];
        this.quedIndexed = [];
    }

    //find the closest ancestor that is safe to edit and has a parent
    public static GetSafeElement(match: Match): ParentedElement | undefined {
        return findSafeAncestor(match.startNode);
    }
}

function findSafeAncestor(node: Element): ParentedElement | undefined {
    const parent = node.parentElement;

    if (!parent)
        return undefined;

    if (!unsafeTags.includes(parent.nodeName?.toUpperCase()))
        return node as ParentedElement;
    return findSafeAncestor(parent);
}

//element with a non-null parent
interface ParentedElement extends Omit<Element, "parentElement"> {
    parentElement: Element;
}
const unsafeTags = ['A'];
