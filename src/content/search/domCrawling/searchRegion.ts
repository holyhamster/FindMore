import { FrameWalker } from './frameWalker'
import { Match } from './match';

//Walks through DOM tree with FrameWalker, 
//keeps track of current position within, returns matches from it
export class SearchRegion
{
    constructor(
        private searchString: string,
        private regexp: RegExp,
        private frameWalker: FrameWalker) {
    }

    stringRegion = "";
    nodes: Element[] = [];
    offset = 0;//offset of the string from the start of the first node

    //expands region, returns true if tree hasn't ended
    public TryExpand(): boolean {
        const newNode = this.frameWalker.NextNode();

        if (!newNode)
            return false;

        this.stringRegion += newNode.textContent;
        this.nodes.push(newNode);
        this.trim();

        return true;
    }

    //get all matches from the current scope, trims it to the end of the last match
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
            const match = {} as Match;
            let MATCH_OUTSIDE_NODE;
            while (MATCH_OUTSIDE_NODE =
                (charOffset + this.nodes[nodeOffset]?.textContent!.length) <= index)
            {
                charOffset += this.nodes[nodeOffset].textContent!.length;
                nodeOffset += 1;
            }
            match.startOffset = index - charOffset;
            match.startNode = this.nodes[nodeOffset];

            while (MATCH_OUTSIDE_NODE =
                ((charOffset + this.nodes[nodeOffset].textContent!.length) < (index + this.searchString.length)))
            {
                charOffset += this.nodes[nodeOffset].textContent!.length;
                nodeOffset += 1;
            }
            match.endOffset = index + this.searchString.length - charOffset;
            match.endNode = this.nodes[nodeOffset];

            matches.push(match);
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