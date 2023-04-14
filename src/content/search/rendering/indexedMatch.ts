import { Match } from "../match";

export class IndexedMatch extends Match {
    constructor(match: Match, public index: number) {
        super(match.startOffset, match.startNode, match.endOffset, match.endNode);
    }
}