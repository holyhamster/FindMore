import { AnchoredMatch } from "./anchoredMatch";

export interface IndexedMatch extends AnchoredMatch {
    index: number;
}

export function IndexMatches(matches: AnchoredMatch[], mapSize: number) {
    const indexedMatches: IndexedMatch[] = [];
    for (let i = 0; i < matches.length; i++) {
        const indexedMatch = matches[i] as IndexedMatch;
        indexedMatch.index = mapSize + i;
        indexedMatches.push(indexedMatch);
    }
    return indexedMatches;
}