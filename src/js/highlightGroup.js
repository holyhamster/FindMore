class HighlightGroup
{
    constructor(_parentNode, _range)
    {
        this.spans = [];
        this.parentNode = _parentNode;
        this.container = document.createElement('SPAN');
        //absolute position is cheaper to calculate, but ignore any scrollbar between itself and closest relative ancestor
        this.relative = !HighlightGroup.hasRelativeAncestor(_parentNode);

        if (this.relative)
            this.container.classList.add('TFContainerRelative');
        else
            this.container.classList.add('TFContainer');

        this.isGroupVisibleAfterUpdate(_range);
    }
    static new(_base)
    {
        return new this(_base);
    }

    isVisible()
    {
        //TODO: add visibility check
        return true;
    }

    getContainerPos(_range)
    {
        if (!this.containerAppended)
        {
            this.parentNode.prepend(this.container);
            this.containerAppended = true;
        }

        _range.selectNode(this.container);
        let result = _range.getBoundingClientRect()
        return result;
    }

    isGroupVisibleAfterUpdate(_range)
    {
        if (!this.anchorRectUpdated)
        {
            this.anchorRectUpdated = true;
            this.anchorRect = this.getContainerPos(_range);
        }
        return Boolean(this.anchorRect);
    }

    highlightRange(_range)
    {
        let rects = _range.getClientRects();

        for (let i = 0; i < rects.length; i++)
        {
            this.addHighlightRect(rects[i]);
        }
    }
    addHighlightRect(_rect)
    {
        if (_rect.width != 0 && _rect.height != 0)
        {
            let span = document.createElement('SPAN');

            if (this.relative)
                span.classList.add('TFHighlight-2');
            else
                span.classList.add('TFHighlight');

            span.style.height = _rect.height + 'px';
            span.style.width = _rect.width + 'px';
            span.style.left =  _rect.left - this.anchorRect.left + 'px';
            span.style.top = _rect.top - this.anchorRect.top + 'px';
            //span.setAttribute("id",
            //` anchor: ${this.rectToString(this.anchorRect)} self:${this.rectToString(_rect)}}` );
            this.spans.push(span);
        }
    }

    rectToString(_rect)
    {
        return `left:${_rect.left.toFixed(2)} top:${_rect.top.toFixed(2)}`
    }

    commit()
    {
        if (!this.anchorRect)
            return;

        let HEAVY_CONTAINER_NEEDS_REMOVAL = this.containerAppended && this.spans.length > 3;
        if (HEAVY_CONTAINER_NEEDS_REMOVAL)
        {
            this.container.remove();
            this.containerAppended = false;
        }

        for (let i = 0; i < this.spans.length; i++)
            this.container.appendChild(this.spans[i]);

        if (!this.containerAppended)
        {
            this.parentNode.prepend(this.container);
            this.containerAppended = true;
        }

        this.anchorRect = undefined;
        this.spans = [];
        this.anchorRectUpdated = false;
    }

    static hasRelativeAncestor(_node)
    {
        let node = _node;

        while (node)
        {
            if (node.nodeType == Node.ELEMENT_NODE)
            {
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
export default HighlightGroup;