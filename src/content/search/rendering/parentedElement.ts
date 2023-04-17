//element with a non-null parent
export interface ParentedElement extends Omit<Element, "parentElement"> {
    parentElement: Element;
}

