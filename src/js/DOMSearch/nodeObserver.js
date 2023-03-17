//Wrapper for IntersectionObserver
//Watches parent elements of nodes with matches, on call appends and sends to processing the ones that are visible
export class NodeObserver {
    constructor(nodeMap, indexMap, sendToProcessing) {
        this.nodeMap = nodeMap;
        this.indexMap = indexMap;
        this.sendToProcessing = sendToProcessing;

        this.observer = new IntersectionObserver((entries) => this.onObserve(entries));
    }

    onObserve(entries) {
        entries.forEach((entry) => {
            const container = this.nodeMap.get(entry.target);
            this.observer.unobserve(entry.target);

            const elementVisible = entry.boundingClientRect.width > 2 && entry.boundingClientRect.height > 2;
            if (!elementVisible)
                return;

            while (container.indexNextMatch(this.indexMap.size))
                this.indexMap.set(this.indexMap.size, container);
            container.appendSelf();
            this.sendToProcessing(container);
        });
    }

    Observe(node) {
        this.observer.observe(node);
    }

    StopObserving()
    {
        this.observer.disconnect();
    }
}