//container for a single DOM parent, handles all highlight rectangles for it
class HighlightContainer
{
    parentNode;
    spanContainer;

    relative;
    visible;

    indexToRectanglesMap = new Map();
    uncommittedSpans = [];

    constructor(_parentNode, _id)
    {
        this.id = _id;
        this.parentNode = _parentNode;
        this.spanContainer = document.createElement('SPAN');
        this.relative = !hasRelativeAncestor(_parentNode);

        if (this.relative)
            this.spanContainer.classList.add(`TFCR${_id}`)
        else
            this.spanContainer.classList.add(`TFC${_id}`)
    }

    highlightRects(_index, _rects)
    {
        if (!this.updatedAfterCommit)
        {
            this.updatedAfterCommit = true;
            this.visible = this.isVisible();
        }

        if (!this.visible)
            return false;

        let newSpans = []
        for (let i = 0; i < _rects.length; i++)
        {
            newSpans.push(this.createAnchoredSpan(_rects[i]))

        }
        if (newSpans.length == 0)
            return false;

        this.indexToRectanglesMap.set(_index, newSpans);
        this.uncommittedSpans = [...this.uncommittedSpans, ...newSpans];

        return true;;
    }

    isVisible()
    {
        let parentStyle = window.getComputedStyle(this.parentNode);

        let visible = parentStyle.visibility != "hidden" && parentStyle.display != "none";

        if (visible)
        {
            let parentBoundingRect = this.parentNode.getBoundingClientRect();
            visible = parentBoundingRect.width >= 1 && parentBoundingRect.height >= 1;
        }

        if (visible)
        {
            if (!this.containerAppended)
            {
                this.parentNode.prepend(this.spanContainer);
                this.containerAppended = true;
            }
            this.anchorRect = this.spanContainer.getBoundingClientRect();
        }
        return visible;
    }

    selectAt(_index)
    {
        let spans = this.indexToRectanglesMap.get(_index);
        if (!spans)
            return;

        spans.forEach(() => {
            for (let i = 0; i < spans.length; i++)
                spans[i].classList.add(`TFHS${this.id}`)
        });
        return spans;
    }
    
    resetSelection(_index)
    {
        let spans = [];
        if (_index)
            spans = [...spans, ...this.indexToRectanglesMap.get(_index)];

        spans.forEach((_span) => {
            if (_span.classList.contains(`TFHS${this.id}`))
                _span.classList.remove(`TFHS${this.id}`)            
        });
    }

    getYPosition(_searchIndex)
    {
        let target = this.indexToRectanglesMap.get(_searchIndex)?.at(0);
        if (!target)
            return;

        return target.getBoundingClientRect().top;
    }

    createAnchoredSpan(_rect)
    {
        let span = document.createElement('SPAN');
        span.classList.add('TFHighlight');
        span.classList.add(`TFH${this.id}`);

        span.style.height = _rect.height + 'px';
        span.style.width = _rect.width + 'px';
        span.style.left = _rect.left - this.anchorRect.left + 'px';
        span.style.top = _rect.top - this.anchorRect.top + 'px';
        return span;
    }

    commit()
    {
        let HEAVY_CONTAINER_NEEDS_REMOVAL = this.containerAppended && this.uncommittedSpans.size > 3;
        if (HEAVY_CONTAINER_NEEDS_REMOVAL) {
            this.spanContainer.remove();
            this.containerAppended = false;
        }

        while (this.uncommittedSpans.length > 0)
            this.spanContainer.appendChild(this.uncommittedSpans.shift())

        if (!this.containerAppended) {
            this.parentNode.prepend(this.spanContainer);
            this.containerAppended = true;
        }

        this.updatedAfterCommit = false;
    }
}

function hasRelativeAncestor(_node) 
{
    let node = _node;

    while (node)
    {
        if (node.nodeType == Node.ELEMENT_NODE)
        {
            let STATIC_ANCESTOR_WITH_SCROLLBAR, ANCESTOR_IS_RELATIVE;

            if (STATIC_ANCESTOR_WITH_SCROLLBAR =
                node.scrollTop > 0 || node.scrollLeft > 0)
                return false;

            if (ANCESTOR_IS_RELATIVE =
                window.getComputedStyle(node).getPropertyValue("position") == "relative")
                return true;
        }
        node = node.parentNode;
    }
    return false;
}
export default HighlightContainer;