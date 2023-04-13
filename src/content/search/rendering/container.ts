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
    public headElement: Element;
    public parentElement: Element;
    constructor(private targetElement: ParentedElement, private searchId: number) {
        this.headElement = document.createElement('FM-CONTAINER');
        this.parentElement = targetElement.parentElement;
    }

    SetAccent(matchIndex: number, accentState: boolean) {
        if (isNaN(matchIndex))
            return;

        const elements = Array.from(this.headElement.getElementsByClassName(`fm-${this.searchId}-${matchIndex}`));

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

    precalculated: Highlight[] = [];
    PrecalculateRectangles(range: Range) {
        const anchor = this.headElement.getBoundingClientRect();
        let match: IndexedMatch | undefined;
        while (match = this.indexedMatches.shift()) 
            match.GetRectangles(range).forEach((rect) =>
                this.precalculated.push(Highlight.build(rect, anchor, this.searchId, match!.index)));
    }

    AppendPrecalculated() {
        //with many append operations it can be profitable to temporarily unappend parent element 
        const HEAVY_CONTAINER = this.precalculated.length > 2;
        if (HEAVY_CONTAINER)
            this.headElement.remove();

        while (this.precalculated.length > 0)
            this.headElement.append(this.precalculated.shift()!);

        if (HEAVY_CONTAINER)
            this.AppendSelf();
    }

    public AppendSelf() {
        this.targetElement.parentElement?.
            insertBefore(this.headElement, this.targetElement?.nextSibling || null);
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
        this.precalculated = [];
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

interface IndexedMatch extends Match {
    index: number;
}