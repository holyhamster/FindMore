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

	static FindClosestAmong(targetMatch, matches) {
		let candidate;
		console.log(`past match`);
		console.log(targetMatch);

		matches.filter((match) => targetMatch.startNode == match.startNode).forEach((match) => {
			
			const distance = Math.abs(match.startOffset - targetMatch.startOffset);
			if (!candidate || candidate.distance > distance)
				candidate = { distance: distance, match: match };
		});
		console.log(candidate?.match);
		return candidate?.match;
	}
}