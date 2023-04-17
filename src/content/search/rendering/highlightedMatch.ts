import { ParentedElement } from "./parentedElement";
import { IndexedMatch } from "./indexedMatch";

//contains elements with colored rectangles above the match
export class HighlightedMatch implements IndexedMatch {
    startOffset: number;
    startNode: Element;
    endOffset: number;
    endNode: Element;
    index: number;
    anchor: ParentedElement;
    public elements: Element[] = [];
    constructor(match: IndexedMatch, searchId: number, range: Range, anchor: DOMRect) {
        this.startOffset = match.startOffset;
        this.startNode = match.startNode;
        this.endOffset = match.endOffset;
        this.endNode = match.endNode;
        this.anchor = match.anchor;

        this.index = match.index;
        this.getRectangles(range).forEach((rect) =>
            this.elements.push(createElement(match.index, searchId, rect, anchor)));
    }

    private getRectangles(range: Range): DOMRect[] {
        range.setStart(this.startNode, this.startOffset);
        range.setEnd(this.endNode, this.endOffset);
        return Array.from(range.getClientRects());
    }

    public AppendSelf(parent: Element) {
        this.elements.forEach((element: Element) =>
            parent.append(element));
    }

    public SetAccent(state: boolean) {
        this.elements.forEach((span: Element) => {
            if (state)
                span.classList.add(`fm-accented`);
            else
                span.classList.remove(`fm-accented`);
        });
    }
}

//create a custom html element with id classes
function createElement(matchId: number, searchId: number,
    rect: DOMRect, anchor: DOMRect): HTMLElement {
    const element = document.createElement('FM-HIGHLIGHT');
    element.classList.add(`fm-${searchId}`, `fm-${searchId}-${matchId}`);
    Object.assign(element.style, rectangleToStyle(rect, anchor))
    return element
}

//describe rectangle relative to given anchor as a .style object
function rectangleToStyle(rect: DOMRect, anchor: DOMRect) {
    return {
        height: rect.height + 'px',
        width: rect.width + 'px',
        left: rect.left - anchor.x + 'px',
        top: rect.top - anchor.y + 'px'
    }
}