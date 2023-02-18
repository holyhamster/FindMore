class HighlightGroup
{
    id;

    parentNode;
    container;

    relative;
    visible;

    searchMap = new Map();
    uncommittedSpans = [];

    constructor(_parentNode, _id)
    {
        this.id = _id;
        this.parentNode = _parentNode;
        this.container = document.createElement('SPAN');
        //absolute position is cheaper to calculate, but ignore any scrollbar between itself and closest relative ancestor
        this.relative = !HighlightGroup.hasRelativeAncestor(_parentNode);

        
        if (this.relative)
            this.container.classList.add(`TFCR${_id}`)
        else
            this.container.classList.add(`TFC${_id}`)

        //this.isGroupVisibleAfterUpdate(_range);
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
                this.parentNode.prepend(this.container);
                this.containerAppended = true;
            }
            this.anchorRect = this.container.getBoundingClientRect();
        }

        return visible;
    }

    highlightRects(_searchIndex, _rects)
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
            newSpans.push(this.createSpan(_rects[i]))

        }
        if (newSpans.length == 0)
            return false;

        this.searchMap.set(_searchIndex, newSpans);
        this.uncommittedSpans = [...this.uncommittedSpans, ...newSpans];

        return true;;
    }
    getYPosition(_searchIndex)
    {
        let target = this.searchMap.get(_searchIndex)?.at(0);
        if (!target)
            return;

        return target.getBoundingClientRect().top;
    }
    selectAt(_searchIndex)
    {
        this.compstyle = window.getComputedStyle(this.parentNode).visibility;
        let spans = this.searchMap.get(_searchIndex);
        if (!spans)
            return;
        for (let i = 0; i < spans.length; i++)
        {
            spans[i].classList.add(`TFHS${this.id}`)
        }
        return spans;
    }
    
    resetSelection(_searchIndex)
    {
        let spans = [];
        if (_searchIndex)
        {
            spans = [...spans, ...this.searchMap.get(_searchIndex)];
        }
        else
        {
            let value, iter = this.searchMap.values();
            while (value = iter.next().value)
                spans = [...spans, ...value];
        }

        for (let i = 0; i < spans.length; i++)
        {
            if (spans[i].classList.contains(`TFHS${this.id}`))
                spans[i].classList.remove(`TFHS${this.id}`)
        }
    }


    createSpan(_rect)
    {
        let span = document.createElement('SPAN');
        span.classList.add('TFHighlight');
        span.classList.add(`TFH${this.id}`);

        span.style.height = _rect.height + 'px';
        span.style.width = _rect.width + 'px';
        span.style.left = _rect.left - this.anchorRect.left + 'px';
        span.style.top = _rect.top - this.anchorRect.top + 'px';
        //span.setAttribute("id",
        //` anchor: ${this.rectToString(this.anchorRect)} self:${this.rectToString(_rect)}}` );
        return span;
    }

    rectToString(_rect) {
        return `left:${_rect.left.toFixed(2)} top:${_rect.top.toFixed(2)}`
    }

    commit()
    {
        if (!this.updatedAfterCommit)
            console.log("committing clean highlight, check your pipeline")

        let HEAVY_CONTAINER_NEEDS_REMOVAL = this.containerAppended && this.uncommittedSpans.size > 3;
        if (HEAVY_CONTAINER_NEEDS_REMOVAL) {
            this.container.remove();
            this.containerAppended = false;
        }

        while (this.uncommittedSpans.length > 0)
            this.container.appendChild(this.uncommittedSpans.shift())

        if (!this.containerAppended) {
            this.parentNode.prepend(this.container);
            this.containerAppended = true;
        }

        this.updatedAfterCommit = false;
    }

    static hasRelativeAncestor(_node) {
        let node = _node;

        while (node) {
            if (node.nodeType == Node.ELEMENT_NODE) {
                if (node.scrollTop > 0 || node.scrollLeft > 0)
                    return false;

                if (window.getComputedStyle(node).getPropertyValue("position") == "relative")
                    return true;
            }
            node = node.parentNode;
        }
        return false;
    }
}

function invertHex(_hex)
{
    return (Number(`0x1${_hex}`) ^ 0xFFFFFF).toString(16).substr(1).toUpperCase()
}

export default HighlightGroup;