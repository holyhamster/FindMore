//Treewalker wrapper that goes into iframes with a callback when locating one

export class FrameWalker {
    
    stack: TreeWalker[];
    constructor(
        root: Element,
        private onNewIframes?: (iframe: HTMLIFrameElement) => void) {
        this.stack = [document.createTreeWalker(root, NodeFilter.SHOW_ALL, condition)];
    }
    
    public NextNode(): Element | null {
        if (this.stack.length == 0)
            return null;

        const node = this.stack[this.stack.length - 1].nextNode();
        //if walker on top of the stack is done, remove it and get the one under it
        if (!node) {
            this.stack.pop();
            return this.NextNode();
        }

        //if node is an iframe, create a new treewalker and add it to the stack
        if (node.nodeName.toUpperCase() == 'IFRAME'){
            const iDocument = (node as HTMLIFrameElement).contentDocument;
            if (iDocument) {
                this.onNewIframes?.(node as HTMLIFrameElement);
                const newWalker = iDocument.createTreeWalker(iDocument.body, NodeFilter.SHOW_ALL, condition);
                this.stack.push(newWalker);
            }
            return this.NextNode();
        }
        return node as Element;
    }
}

export interface TextNode extends Node {
    textContent: string;
}
//Target nodes with textcontent
//Iframes are accepted to be processed by the framewalker, style and script tags are rejected
const condition = {
    acceptNode: (node: any) =>
    {
        if (node.nodeName.toUpperCase() == "IFRAME")
            return NodeFilter.FILTER_ACCEPT;

        if (node.nodeName.toUpperCase() == "STYLE" ||
            node.nodeName.toUpperCase() == "SCRIPT")
            return NodeFilter.FILTER_REJECT;

        if (node.nodeName.toUpperCase() == "#TEXT" && node?.textContent!= "")
            return NodeFilter.FILTER_ACCEPT;

        return NodeFilter.FILTER_SKIP;
    }
};
