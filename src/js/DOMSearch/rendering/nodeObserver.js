//Wrapper for IntersectionObserver
//Watches parent elements of nodes with matches
//On call indexes all visible matches into the mao and sends its containers into a callback
export class NodeObserver {
    constructor(nodeMap, indexMapRef, containerCallback) {
        this.nodeMap = nodeMap;
        this.indexMap = indexMapRef;
        this.sendToProcessing = containerCallback;

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