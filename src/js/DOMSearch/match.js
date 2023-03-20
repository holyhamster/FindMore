//points at a region in the dom tree with a match

export class Match
{
	constructor(startOffset, startNode, endOffset, endNode)
	{
		this.startOffset = startOffset;
		this.startNode = startNode;
		this.endOffset = endOffset;
		this.endNode = endNode;
	}
}