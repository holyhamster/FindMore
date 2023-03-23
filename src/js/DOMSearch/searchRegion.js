import { Match } from './match.js';
import { FrameWalker } from './frameWalker.js'

//Walks through DOM tree with frameWalker, keeps track of current position within, returns matches from it

export class SearchRegion
{
    constructor(searchString, regexp, eventElement) {
        this.searchString = searchString;
        this.regexp = regexp;

        this.stringRegion = "";
        this.nodes = [];
        this.offset = 0;    //offset of the string from the start of the first node
        this.treeWalk = FrameWalker.createFrameWalker(
            document.body,
            (iframe) => eventElement.dispatchEvent(GetNewIframeEvent(iframe)));
    }

    //expands region, returns true if tree hasn't ended
    TryExpand() {
        const newNode = this.treeWalk.nextNode();

        if (!newNode)
            return false;

        this.stringRegion += newNode.textContent;
        this.nodes.push(newNode);
        this.trim();

        return true;
    }

    //get all matches from the current region, trims it to the end of the last match
    GetMatches()
    {
        if (this.nodes.length == 0)
            return [];
        
        const regexMatches = [...this.stringRegion.substring(this.offset).matchAll(this.regexp)];

        const matches = [];
        let charOffset = 0, nodeOffset = 0;
        regexMatches.forEach((regexMatch) =>
        {
            regexMatch.index += this.offset;
            let MATCH_OUTSIDE_NODE;
            while (MATCH_OUTSIDE_NODE =
                (charOffset + this.nodes[nodeOffset].textContent.length) <= regexMatch.index)
            {
                charOffset += this.nodes[nodeOffset].textContent.length;
                nodeOffset += 1;
            }
            const start = { offset: regexMatch.index - charOffset, node: this.nodes[nodeOffset] };

            while (MATCH_OUTSIDE_NODE =
                ((charOffset + this.nodes[nodeOffset].textContent.length) < (regexMatch.index + this.searchString.length)))
            {
                charOffset += this.nodes[nodeOffset].textContent.length;
                nodeOffset += 1;
            }
            const end = { offset: regexMatch.index + this.searchString.length - charOffset, node: this.nodes[nodeOffset] };
            const parent = start.node.parentNode;
            matches.push(new Match(start, end, parent));
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
        let REGION_IS_TOO_LONG;
        while (this.nodes.length > 0 && (REGION_IS_TOO_LONG = 
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
        this.nodes.forEach((nodes) => this.stringRegion += nodes.textContent );
    }
}
function firstNonInlineAncestor(node) {
    const parent = node.parentNode;
    if (!parent)
        return node;

    if (!nodeIsInlineEditing(parent))
        return parent;

    if (parent.parentNode)
        return firstNonInlineAncestor(parent)
}
function nodeIsInlineEditing(node) {
    return inlineNodeNames.includes(node?.nodeName?.toUpperCase());
}
const inlineNodeNames = ['A', 'B', 'I', 'EM', 'MARK', 'STRONG', 'SMALL']; 

export function GetNewIframeEvent(iframe) {
    const event = new Event("fm-new-iframe");
    event.iframe = iframe;
    return event;
}