//single highlight rectangle

export class Highlight extends HTMLElement {
    static build(rect: DOMRect, anchor: DOMRect, searchId: number, matchId: number) {
        const element = document.createElement('FM-HIGHLIGHT') as Highlight;
        element.classList.add(`fm-${searchId}`, `fm-${searchId}-${matchId}`);
        Object.assign(element.style, rectangleToStyle(rect, anchor));
        return element;
    }

    public accent() { }
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