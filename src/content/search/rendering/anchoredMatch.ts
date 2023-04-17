import { Match } from "../domCrawling/match";
import { ParentedElement } from "./parentedElement";

//match with an element after which a highlight can be placed
export interface AnchoredMatch extends Match {
    anchor: ParentedElement;
}