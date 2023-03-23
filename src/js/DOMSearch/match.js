//Points at a region in the dom tree that contains a search match

export class Match {
    constructor(start, end) {
        this.startOffset = start.offset;
        this.startNode = start.node;
        this.endOffset = end.offset;
        this.endNode = end.node;
    }

    GetRectangles(range) {
        range.setStart(this.startNode, this.startOffset);
        range.setEnd(this.endNode, this.endOffset);
        return Array.from(range.getClientRects());
    }

    //finds a closest to targetMatch among matches
    //TODO: currently only searches among matches with the same startNode
    static FindClosestAmong(matches, targetMatch) {
        let candidate;
        matches?.filter((match) => targetMatch?.startNode == match.startNode).forEach((match) => {
            const distance = Math.abs(match.startOffset - targetMatch.startOffset);
            if (!candidate || candidate.distance > distance)
                candidate = { distance: distance, match: match };
        });
        return candidate?.match;
    }
}