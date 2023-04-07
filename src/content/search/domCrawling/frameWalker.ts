//Treewalker wrapper that goes into iframes with a callback when locating one

export class FrameWalker {
    onNewIframes?: (iframe: HTMLIFrameElement) => void;
    que: TreeWalker[] = [];
    static build(root: Element, onNewIframes: (iframe: HTMLIFrameElement) => void) {
        const frameWalker = new FrameWalker();
        frameWalker.onNewIframes = onNewIframes;
        frameWalker.que = [document.createTreeWalker(root, NodeFilter.SHOW_ALL, condition)];
        return frameWalker;
    }

    
    public NextNode(): Element | null {
        if (this.que.length == 0)
            return null;

        const node = this.que[this.que.length - 1].nextNode();

        if (!node) {
            this.que.pop();
            return this.NextNode();
        }

        if (node.nodeName.toUpperCase() == 'IFRAME'){
            const iDocument = (node as HTMLIFrameElement).contentDocument;
            if (iDocument) {
                console.log(node);
                this.onNewIframes?.(node as HTMLIFrameElement);
                this.que.push(iDocument.createTreeWalker(iDocument.body, NodeFilter.SHOW_ALL, condition));
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

        if (node.nodeName.toUpperCase() == "#TEXT" && node.textContent)
            return NodeFilter.FILTER_ACCEPT;

        return NodeFilter.FILTER_SKIP;
    }
};
