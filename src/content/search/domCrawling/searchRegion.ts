import { Match } from '../match';
import { FrameWalker } from './frameWalker'

//Walks through DOM tree with frameWalker, keeps track of current position within, returns matches from it

export class SearchRegion
{
    treeWalk: FrameWalker;
    constructor(
        private searchString: string,
        private regexp: RegExp,
        eventElement: Element) {

        this.treeWalk = FrameWalker.build(document.body,
            (iframe: HTMLIFrameElement) => eventElement.dispatchEvent(new NewIFrameEvent(iframe)));
    }

    stringRegion = "";
    nodes: Element[] = [];
    offset = 0;//offset of the string from the start of the first node

    //expands region, returns true if tree hasn't ended
    public TryExpand(): boolean {
        const newNode = this.treeWalk.NextNode();

        if (!newNode)
            return false;

        this.stringRegion += newNode.textContent;
        this.nodes.push(newNode);
        this.trim();

        return true;
    }

    //get all matches from the current region, trims it to the end of the last match
    public GetMatches(): Match[]
    {
        if (this.nodes.length == 0)
            return [];
        
        const regexMatches = [...this.stringRegion.substring(this.offset).matchAll(this.regexp)];

        const matches: Match[] = [];
        let charOffset = 0, nodeOffset = 0;
        regexMatches.forEach((regexMatch: RegExpMatchArray) =>
        {
            const index = this.offset + (regexMatch?.index || 0);
            let MATCH_OUTSIDE_NODE;
            while (MATCH_OUTSIDE_NODE =
                (charOffset + this.nodes[nodeOffset]?.textContent!.length) <= index)
            {
                charOffset += this.nodes[nodeOffset].textContent!.length;
                nodeOffset += 1;
            }
            const startOffset = index - charOffset;
            const startNode = this.nodes[nodeOffset];

            while (MATCH_OUTSIDE_NODE =
                ((charOffset + this.nodes[nodeOffset].textContent!.length) < (index + this.searchString.length)))
            {
                charOffset += this.nodes[nodeOffset].textContent!.length;
                nodeOffset += 1;
            }
            const endOffset = index + this.searchString.length - charOffset;
            const endNode = this.nodes[nodeOffset];

            matches.push(new Match(startOffset, startNode, endOffset, endNode,
                findSafeAncestor(startNode)));
        });

        if (matches.length > 0)
        {
            const lastMatch = matches[matches.length - 1];
            this.trimToPoint(lastMatch.endNode, lastMatch.endOffset);
        }
        return matches;
    }

    private trim()
    {
        let REGION_IS_TOO_LONG;
        while (this.nodes.length > 0 && (REGION_IS_TOO_LONG = 
                ((this.stringRegion.length - this.nodes[0].textContent!.length) > this.searchString.length - 1))) 
        {
            this.stringRegion = this.stringRegion.substring(this.nodes[0].textContent!.length);
            this.nodes.shift();
            this.offset = 0;
        }
    }

    private trimToPoint(node: Element, offset: number)
    {
        this.offset = offset;
        this.nodes = this.nodes.slice(this.nodes.indexOf(node));
        this.stringRegion = "";
        this.nodes.forEach((nodes) => this.stringRegion += nodes.textContent );
    }
}

//some tags are unsafe to edit, climb up to find closest safe one
function findSafeAncestor(node: Element): Element {
    const parent = node?.parentElement;

    if (!parent)
        return node;

    if (!unsafeTags.includes(parent.nodeName?.toUpperCase()))
        return node;

    return findSafeAncestor(parent);
}

const unsafeTags = ['A'];

export class NewIFrameEvent extends Event {
    static readonly type: string = "fm-new-iframe";
    constructor(public iframe: HTMLIFrameElement) {
        super(NewIFrameEvent.type);
    }
}