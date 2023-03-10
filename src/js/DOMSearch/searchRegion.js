//maintains and advances current search scope with a treewalker

class SearchRegion
{
    constructor(_searchString, _regexp, _eventElem) {
        this.searchString = _searchString;
        this.regexp = _regexp;

        this.stringRegion = "";
        this.nodes = [];
        this.offset = 0;    //offset of the string from the start of the first node

        const newIFramesEvent = new Event(`fm-new-iframe`);
        const onNewIFrame = (_iframe) =>
        {
            newIFramesEvent.iframe = _iframe;
            _eventElem.dispatchEvent(newIFramesEvent);
        };

        this.treeWalk = getTreeWalkPlus(onNewIFrame);
    }

    expand() {
        let newNode = this.treeWalk.nextNodePlus();

        if (!newNode)
            return false;

        this.stringRegion += newNode.textContent;
        this.nodes.push(newNode);
        this.trim();

        return true;
    }

    getMatches()
    {
        if (this.nodes.length == 0)
            return [];

        const matches = [...this.stringRegion.substring(this.offset).matchAll(this.regexp)];
        let charOffset = 0, nodeOffset = 0;

        matches.forEach((_match) =>
        {
            _match.index += this.offset;
            let MATCH_INSIDE_NODE;

            while (MATCH_INSIDE_NODE =
                (charOffset + this.nodes[nodeOffset].textContent.length) <= _match.index)
            {
                charOffset += this.nodes[nodeOffset].textContent.length;
                nodeOffset += 1;
            }

            _match.startNode = this.nodes[nodeOffset];
            _match.startOffset = _match.index - charOffset;

            while (MATCH_INSIDE_NODE =
                ((charOffset + this.nodes[nodeOffset].textContent.length) < (_match.index + this.searchString.length)))
            {
                charOffset += this.nodes[nodeOffset].textContent.length;
                nodeOffset += 1;
            }
            _match.endNode = this.nodes[nodeOffset];
            _match.endOffset = _match.index + this.searchString.length - charOffset;
        });

        if (matches.length > 0)
        {
            const lastMatch = matches[matches.length - 1];
            this.trimToPoint(lastMatch.endIndex, lastMatch.endOffset);
        }
        return matches;
    }

    trim()
    {
        let SEARCH_REGION_IS_TOO_LONG;
        while (SEARCH_REGION_IS_TOO_LONG = (this.nodes.length > 0 &&
            ((this.stringRegion.length - this.nodes[0].textContent.length) > this.searchString.length - 1))) 
        {
            this.stringRegion = this.stringRegion.substring(this.nodes[0].textContent.length);
            this.nodes.shift();
            this.offset = 0;
        }
    }

    trimToPoint(_nodeIndex, _offset)
    {
        this.offset = _offset;
        this.nodes = this.nodes.slice(_nodeIndex);
        this.stringRegion = "";
        this.nodes.forEach((_nodes) => { this.stringRegion += _nodes.textContent });
    }
}

const treeWalkerCondition = {
    acceptNode: (node) =>
    {
        if (node.nodeName.toUpperCase() == "IFRAME")
            return NodeFilter.FILTER_ACCEPT;

        if (node.nodeName.toUpperCase() == "STYLE" ||
            node.nodeName.toUpperCase() == "SCRIPT")
            return NodeFilter.FILTER_REJECT;

        if (node.nodeType == Node.ELEMENT_NODE)
        {
            const classes = node.id.toString().split(/\s+/);
            const NODE_IS_SEARCHBAR_SHADOWROOT = classes.includes(`TFShadowRoot`);
            if (NODE_IS_SEARCHBAR_SHADOWROOT)
                return NodeFilter.FILTER_REJECT;
        }

        if (node.nodeName.toUpperCase() == "#TEXT" && node.textContent)
            return NodeFilter.FILTER_ACCEPT;

        return NodeFilter.FILTER_SKIP;
    }
};

//treewalker than includes iframes and sends event every time it finds a new one
function getTreeWalkPlus(_onNewIFrame)
{
    const treeWalker = document.createTreeWalker(
        document.body, NodeFilter.SHOW_ALL, treeWalkerCondition);
    treeWalker.que = [treeWalker];

    treeWalker.nextNodePlus = function ()
    {
        if (this.que.length == 0)
            return null;

        const nextNode = this.que[this.que.length - 1].nextNode();

        if (!nextNode)
        {
            this.que.pop();
            return this.nextNodePlus();
        }

        if (nextNode.nodeName.toUpperCase() == 'IFRAME' &&
            nextNode.contentDocument)
        {
            const iframeDoc = nextNode.contentDocument;
            const iframeWalker = iframeDoc.createTreeWalker(
                iframeDoc.body, NodeFilter.SHOW_ALL, treeWalkerCondition);
            _onNewIFrame(nextNode);
            this.que.push(iframeWalker);
            return this.nextNodePlus();
        }

        return nextNode;
    };
    return treeWalker;
}

export default SearchRegion;