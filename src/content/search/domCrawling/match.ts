import { ParentedElement } from "../rendering/parentedElement";

//Points at a region in the dom tree that contains a search match
export interface Match {
    startOffset: number;
    startNode: Element;
    endOffset: number;
    endNode: Element;
}

//finds a closest to targetMatch among matches
//TODO: currently only searches among matches with the same startNode
export function FindIndexOfClosest(matches: Match[], targetMatch: Match) {
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
    return resultMatch ? matches.indexOf(resultMatch) : undefined;
}

//returns element that is safe to add to without a layout shift
export function GetSafeElement(match: Match): ParentedElement | undefined {
    return findSafeAncestor(match.startNode);
}

function findSafeAncestor(node: Element): ParentedElement | undefined {
    const parent = node.parentElement;

    if (!parent)
        return undefined;

    if (!unsafeTags.includes(parent.nodeName?.toUpperCase()))
        return node as ParentedElement;
    return findSafeAncestor(parent);
}

const unsafeTags = ['A'];