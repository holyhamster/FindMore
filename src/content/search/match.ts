//Points at a region in the dom tree that contains a search match

export class Match {
    constructor(
        public startOffset: number,
        public startNode: Element,
        public endOffset: number,
        public endNode: Element) { }

    public GetRectangles(range: Range): DOMRect[] {
        range.setStart(this.startNode, this.startOffset);
        range.setEnd(this.endNode, this.endOffset);
        return Array.from(range.getClientRects());
    }

    //finds a closest to targetMatch among matches
    //TODO: currently only searches among matches with the same startNode
    public static FindIndexOfClosest(matches: Match[], targetMatch: Match ) {
        let resultMatch: Match | undefined;
        let resultDistance: number = Infinity;

        matches?.filter(
            (iMatch) => targetMatch.startNode == iMatch.startNode).forEach(
                (jMatch) => {
                    const distance = Math.abs(jMatch.startOffset - targetMatch.startOffset);
                    if (!resultMatch || resultDistance > distance) {
                        resultMatch = jMatch;
                        resultDistance = distance;
                    }
                });
        return resultMatch? matches.indexOf(resultMatch) : undefined;
    }
}

