import Match from './match.js';

//Maintains and advances current search through DOM tree scope with treewalker

export class SearchRegion
{
    constructor(searchString, regexp, eventElement) {
        this.searchString = searchString;
        this.regexp = regexp;

        this.stringRegion = "";
        this.nodes = [];
        this.offset = 0;    //offset of the string from the start of the first node

        this.treeWalk = getTreeWalkPlus((iframe) => eventElement.dispatchEvent(GetNewIframeEvent(iframe)));
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

        
        const regexMatches = [...this.stringRegion.substring(this.offset).matchAll(this.regexp)];
        

        const matches = [];
        let charOffset = 0, nodeOffset = 0;
        regexMatches.forEach((regexMatch) =>
        {
            regexMatch.index += this.offset;
            let MATCH_INSIDE_NODE;

            while (MATCH_INSIDE_NODE =
                (charOffset + this.nodes[nodeOffset].textContent.length) <= regexMatch.index)
            {
                charOffset += this.nodes[nodeOffset].textContent.length;
                nodeOffset += 1;
            }

            const startNode = this.nodes[nodeOffset];
            const startOffset = regexMatch.index - charOffset;

            while (MATCH_INSIDE_NODE =
                ((charOffset + this.nodes[nodeOffset].textContent.length) < (regexMatch.index + this.searchString.length)))
            {
                charOffset += this.nodes[nodeOffset].textContent.length;
                nodeOffset += 1;
            }
            const endNode = this.nodes[nodeOffset];
            const endOffset = regexMatch.index + this.searchString.length - charOffset;
            matches.push(new Match(startOffset, startNode, endOffset, endNode))
        });

        if (matches.length > 0)
        {
            const lastMatch = matches[matches.length - 1];
            this.trimToPoint(lastMatch.endNode, lastMatch.endOffset);
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

    trimToPoint(node, offset)
    {
        this.offset = offset;
        this.nodes = this.nodes.slice(this.nodes.indexOf(node));
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
function getTreeWalkPlus(onNewIFrame)
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
            onNewIFrame(nextNode);
            this.que.push(iframeWalker);
            return this.nextNodePlus();
        }

        return nextNode;
    };
    return treeWalker;
}

export function GetNewIframeEvent(iframe) {
    const event = new Event("fm-new-iframe");
    event.iframe = iframe;
    return event;
}