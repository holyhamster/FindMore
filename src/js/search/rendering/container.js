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
