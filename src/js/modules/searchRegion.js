//Keeps all information about the current search scope and its controls

class SearchRegion
{
    constructor(_searchString, _regexp, _onNewIFrame) {
        this.searchString = _searchString;
        this.regexp = _regexp;

        this.string = "";
        this.nodes = [];
        this.offset = 0;    //offset of the string from the start of the first node
        this.treeWalk = getTreeWalk(_onNewIFrame);
    }

    addNextNode() {
        let newNode = this.treeWalk.nextNodePlus();

        if (!newNode)
            return false;

        this.string += newNode.textContent;
        this.nodes.push(newNode);
        this.trim();

        return true;
    }

    trim() {
        let SEARCH_REGION_IS_TOO_LONG;
        while (SEARCH_REGION_IS_TOO_LONG = (this.nodes.length > 0 &&
            ((this.string.length - this.nodes[0].textContent.length) > this.searchString.length - 1))) 
        {
            this.string = this.string.substring(this.nodes[0].textContent.length);
            this.nodes.shift();
            this.offset = 0;
        }
    }

    trimToPoint(_nodeIndex, _offset) {
        this.offset = _offset;
        this.nodes = this.nodes.slice(_nodeIndex);
        this.string = "";
        this.nodes.forEach((_nodes) => { this.string += _nodes.textContent });
    }

    getMatches(_amount)
    {
        if (this.nodes.length == 0 | _amount == 0)
            return [];
        
        let matches = [...this.string.substring(this.offset).matchAll(this.regexp)];
        matches = matches.splice(0, _amount);
        let charOffset = 0, nodeOffset = 0;

        matches.forEach((_match) =>
        {
            _match.index += this.offset;
            let MATCH_INSIDE_NODE;

            while (MATCH_INSIDE_NODE =
                (charOffset + this.nodes[nodeOffset].textContent.length)
            <= _match.index)
            {
                charOffset += this.nodes[nodeOffset].textContent.length;
                nodeOffset += 1;
            }

            _match.startNode = this.nodes[nodeOffset];
            _match.startOffset = _match.index - charOffset;

            while (MATCH_INSIDE_NODE =
                (charOffset + this.nodes[nodeOffset].textContent.length <
                    _match.index + this.searchString.length))
            {
                charOffset += this.nodes[nodeOffset].textContent.length;
                nodeOffset += 1;
            }
            _match.endNode = this.nodes[nodeOffset];
            _match.endOffset = _match.index + this.searchString.length - charOffset;
        });
        return matches;
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
            let classes = node.id.toString().split(/\s+/);
            let NODE_IS_SEARCHBAR_SHADOWROOT = classes.includes(`TFShadowRoot`);
            if (NODE_IS_SEARCHBAR_SHADOWROOT)
                return NodeFilter.FILTER_REJECT;
        }

        if (node.nodeName.toUpperCase() == "#TEXT" && node.textContent)
            return NodeFilter.FILTER_ACCEPT;

        return NodeFilter.FILTER_SKIP;
    }
};

function getTreeWalk(_onNewIFrame)
{
    let treeWalker = document.createTreeWalker(
        document.body, NodeFilter.SHOW_ALL, treeWalkerCondition);
    treeWalker.que = [treeWalker];

    treeWalker.nextNodePlus = function ()
    {
        if (this.que.length == 0)
            return null;

        let nextNode = this.que.slice(-1)[0].nextNode();

        if (!nextNode)
        {
            this.que.pop();
            //console.log(`surfacing back to ${this.que.length}-level frame`);
            return this.nextNodePlus();
        }

        if (nextNode.nodeName.toUpperCase() == 'IFRAME' &&
            nextNode.contentDocument)
        {
            let iframeDoc = nextNode.contentDocument;
            let iframeWalker = iframeDoc.createTreeWalker(
                iframeDoc.body, NodeFilter.SHOW_ALL, treeWalkerCondition);
            _onNewIFrame(nextNode);
            this.que.push(iframeWalker);
            //console.log(`diving deeper into ${this.que.length}-level frame`);
            return this.nextNodePlus();
        }

        return nextNode;
    };
    return treeWalker;
}

export default SearchRegion;