//Holds all highlight rectangles for matches under a single parent element in DOM tree
//Creating a highlight is split into stages to be done in batches to minimize browser reflow calls:
//QueMatch() -> 
//IndexNextMatch() -> 
//AppendSelf() -> 
//PrecalculateRectangles() -> 
//AppendPrecalculated()

export class Container
{
    constructor(parentNode, targetNode, panelId)
    {
        this.parentNode = parentNode;
        this.targetNode = targetNode;
        this.id = panelId;

        this.headElement = document.createElement('FM-CONTAINER');
        if (relativePositionRequired(parentNode))
            this.headElement.classList.add(`fm-relative`)
    }

    SetAccent(matchIndex, accentState)
    {
        if (isNaN(matchIndex))
            return;

        const elements = Array.from(this.headElement.getElementsByClassName(`fm-${this.id}-${matchIndex}`));

        elements.forEach((span) =>
        {
            if (accentState)
                span.classList.add(`fm-accented`);
            else
                span.classList.remove(`fm-accented`);
        });

        return elements;
    }

    AppendSelf()
    {
        this.targetNode.after(this.headElement);
    }

    quedMatches = [];
    QueMatch(match)
    {
        this.quedMatches.push(match);
    }

    indexedMatches = [];
    IndexNextMatch(newIndex)
    {
        const match = this.quedMatches.shift();
        if (!match)
            return false;
        match.index = newIndex;
        this.indexedMatches.push(match);
        return true;
    }

    indexToMatch = new Map();
    precalculatedNodes = [];
    PrecalculateRectangles(range)
    {
        const anchor = this.headElement.getBoundingClientRect();
        while (this.indexedMatches.length > 0) {
            const match = this.indexedMatches.shift();

            this.indexToMatch.set(match.index, match);
            const elements = [];
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

    AppendPrecalculated()
    {
        //with many append operations it can be profitable to temporarily unappend parent element 
        const HEAVY_CONTAINER = this.precalculatedNodes.length > 2;    
        if (HEAVY_CONTAINER)
            this.headElement.remove();

        while (this.precalculatedNodes.length > 0)
            this.headElement.append(this.precalculatedNodes.shift());

        if (HEAVY_CONTAINER)
            this.AppendSelf();
    }

    GetMatch(index) {
        return this.indexToMatch.get(index);
    }

    GetAllMatches() {
        return Array.from(this.indexToMatch.values());
    }

    Remove()
    {
        this.headElement.remove();
        this.ClearCache();
    }

    ClearCache() {
        this.quedMatches = [];
        this.precalculatedNodes = [];
    }
}

//container head element can be created with relative or absolute positioning
//position:absolute is preffered: it's taken out of the document's flow and will not affect its layout
//position:relative is required when there's an ancestor with a nested scrollbar and no other position:relative node between them
//  (in the latter case, position:absolute element will not be affected by the nested scrollbar)
function relativePositionRequired(node) 
{
    return true;
    for (let iNode = node; iNode; iNode = iNode.parentNode)
    {
        if (iNode.nodeType != Node.ELEMENT_NODE)
            continue;

        if (iNode.scrollTop > 0 || iNode.scrollLeft > 0)
            return true;

        const style = window.getComputedStyle(iNode);
        if (style.overflow === 'auto' || style.overflow === 'scroll')
            return true;

        if (style.getPropertyValue("position") == "relative")
            return false;
    }
    return false;
}