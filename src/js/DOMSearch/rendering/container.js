//container holds an fm-container headElement that holds all fm-relative rectangles for a single DOM parent
class Container
{
    constructor(parentNode, id)
    {
        this.parentNode = parentNode;
        this.id = id;

        this.headElement = document.createElement('FM-CONTAINER');
        if (relativePositionRequired(parentNode))
            this.headElement.classList.add(`fm-relative`)
    }

    setAccent(index, state)
    {
        if (isNaN(index))
            return;

        const elements = Array.from(document.getElementsByClassName(`fm-${this.id}-${index}`));

        elements.forEach((span) =>
        {
            if (state)
                span.classList.add(`fm-accented`);
            else
                span.classList.remove(`fm-accented`);
        });

        return elements;
    }

    appendSelf()
    {
        this.parentNode.append(this.headElement);
    }

    remove()
    {
        this.headElement.remove();
        this.emptyProcessingCache();
    }

    quedMatches = [];
    queMatch(match)
    {
        this.quedMatches.push(match);
    }

    indexToMatches = new Map();
    indexNextMatch(newIndex)
    {
        const match = this.quedMatches.shift();
        if (!match)
            return false;

        this.indexToMatches.set(newIndex, match)
        return true;
    }

    calculatedElements = [];
    precalculateRectangles(range)
    {
        const anchor = this.headElement.getBoundingClientRect();
        this.indexToMatches.forEach((match, index) =>
        {
            range.setStart(match.startNode, match.startOffset);
            range.setEnd(match.endNode, match.endOffset);
            const rects = Array.from(range.getClientRects());

            rects.forEach((rect) =>
            {
                const rectElement = document.createElement('FM-HIGHLIGHT');
                rectElement.classList.add(`fm-${this.id}`, `fm-${this.id}-${index}`);
                rectElement.style.height = rect.height + 'px';
                rectElement.style.width = rect.width + 'px';
                rectElement.style.left = rect.left - anchor.x + 'px';
                rectElement.style.top = rect.top - anchor.y + 'px';
                this.calculatedElements.push(rectElement);
            });
        });
        this.indexToMatches = new Map();
    }

    finalize()
    {
        //with many append operations it can be profitable to temporarily unappend parent element 
        const HEAVY_CONTAINER = this.calculatedElements.length > 2;    
        if (HEAVY_CONTAINER)
            this.headElement.remove();


        this.calculatedElements.forEach((span) => this.headElement.append(span) );
        this.calculatedElements = [];

        if (HEAVY_CONTAINER)
            this.parentNode.appendChild(this.headElement);
    }

    emptyProcessingCache()
    {
        this.quedMatches = [];
        this.indexToMatches = new Map();
    }
}

//highlight rectangles can be created with relative or absolute positioning
//absolute is preffered because it's a lot cheaper to draw during flow calls
//relative is required when there's no relative node between target and a nested scrollbar 
//  (if absolute elements aren't anchored to relative nodes they will not follow scrollbar's position)
function relativePositionRequired(node) 
{
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


export default Container;