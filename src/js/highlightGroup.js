class HighlightGroup
{
    highlightClassName;
    selectedClassName;
    parentNode;
    container;
    relative;
    visible;
    searchMap = new Map();
    newSpans = [];
    color;

    constructor(_parentNode, _range, _id, _color)
    {
        this.color = _color;
        this.highlightClassName = `TFH${_id}`;
        this.selectedClassName = `TFHS${_id}`;
        this.parentNode = _parentNode;
        this.container = document.createElement('SPAN');
        //absolute position is cheaper to calculate, but ignore any scrollbar between itself and closest relative ancestor
        this.relative = !HighlightGroup.hasRelativeAncestor(_parentNode);

        this.container.classList.add(`TFC${_id}`)
        if (this.relative)
            this.container.classList.add('TFContainerRelative');
        else
            this.container.classList.add('TFContainer');

        //this.isGroupVisibleAfterUpdate(_range);
    }
    static new(_base) {
        return new this(_base);
    }

    updateVisibility()
    {
        this.updatedAfterCommit = true;

        let parentStyle = window.getComputedStyle(this.parentNode);

        this.visible = parentStyle.visibility != "hidden" && parentStyle.display != "none";

        if (this.visible)
        {
            let parentBoundingRect = this.parentNode.getBoundingClientRect();
            this.visible = parentBoundingRect.width >= 1 && parentBoundingRect.height >= 1;
        }

        if (this.visible)
        {
            if (!this.containerAppended)
            {
                this.parentNode.prepend(this.container);
                this.containerAppended = true;
            }
            this.anchorRect = this.container.getBoundingClientRect();
        }

        return this.visible;
    }

    highlightRects(_searchIndex, _rects)
    {
        if (!this.updatedAfterCommit)
            this.updateVisibility();

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
        this.newSpans = [...this.newSpans, ...newSpans];

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
            spans[i].classList.add(this.selectedClassName)
        }
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
            if (spans[i].classList.contains(this.selectedClassName))
                spans[i].classList.remove(this.selectedClassName)
        }
    }


    createSpan(_rect)
    {
        let span = document.createElement('SPAN');
        span.classList.add('TFHighlight');
        span.classList.add(this.highlightClassName);

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

        let HEAVY_CONTAINER_NEEDS_REMOVAL = this.containerAppended && this.newSpans.size > 3;
        if (HEAVY_CONTAINER_NEEDS_REMOVAL) {
            this.container.remove();
            this.containerAppended = false;
        }

        for (let i = 0; i < this.newSpans.length; i++)
            this.container.appendChild(this.newSpans[i]);

        if (!this.containerAppended) {
            this.parentNode.prepend(this.container);
            this.containerAppended = true;
        }

        this.newSpans = [];
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