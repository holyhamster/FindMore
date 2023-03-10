//container for a single DOM parent, handles all highlight rectangles for it
class Container
{
    parentNode;
    headSpan;

    childSpansMap = new Map();
    uncommittedSpans = [];

    constructor(_parentNode, _id)
    {
        this.id = _id;
        this.parentNode = _parentNode;
        this.headSpan = document.createElement('FM-CONTAINER');

        if (!hasRelativeAncestor(_parentNode))
            this.headSpan.classList.add(`fm-relative`)
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

        let newSpans = [];
        _rects.forEach((_rect) => { newSpans.push(this.createAnchoredSpan(_rect)); });

        if (newSpans.length == 0)
            return false;

        this.childSpansMap.set(_index, newSpans);
        this.uncommittedSpans = [...this.uncommittedSpans, ...newSpans];

        return true;
    }

    isVisible()
    {
        this.parentStyle = this.parentStyle || window.getComputedStyle(this.parentNode);

        let isVisible =
            this.parentStyle.visibility != "hidden" && this.parentStyle.display != "none";

        if (!isVisible)
            return isVisible;

        //const parentBoundingRect = this.parentNode.getBoundingClientRect();
        //isVisible = parentBoundingRect.width >= 1 && parentBoundingRect.height >= 1;

        //if (!isVisible)
            //return isVisible; 

        this.setAppendance(true);
        this.anchorRect = this.headSpan.getBoundingClientRect();

        return isVisible;
    }

    setSelectionAt(_index, _state)
    {
        if (isNaN(_index))
            return;

        const spans = this.childSpansMap.get(_index);

        const spanOperation = _state ?
            (_span) => { _span.classList.add(`fm-accented`) } :
            (_span) => { _span.classList.remove(`fm-accented`) };

        spans.forEach(spanOperation);
        return spans;
    }

    createAnchoredSpan(_rect)
    {
        let span = document.createElement('FM-HIGHLIGHT');
        span.classList.add(`fm-${this.id}`)
        span.style.height = _rect.height + 'px';
        span.style.width = _rect.width + 'px';
        span.style.left = _rect.left - this.anchorRect.left + 'px';
        span.style.top = _rect.top - this.anchorRect.top + 'px';
        return span;
    }

    commit()
    {
        const HEAVY_CONTAINER_NEEDS_REMOVAL = this.containerAppended && this.uncommittedSpans.size > 3;
        if (HEAVY_CONTAINER_NEEDS_REMOVAL)
        {
            this.setAppendance(false);
        }
        
        while (this.uncommittedSpans.length > 0)
            this.headSpan.appendChild(this.uncommittedSpans.shift())

        this.setAppendance(true)

        this.updatedAfterCommit = false;
        this.parentStyle = null;
    }
    remove()
    {
        this.setAppendance(false);
    }
    setAppendance(_appended)
    {
        if (this.containerAppended == _appended)
            return;

        if (_appended)
            this.parentNode.prepend(this.headSpan);
        else
            this.headSpan.remove();

        this.containerAppended = _appended;
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
export default Container;