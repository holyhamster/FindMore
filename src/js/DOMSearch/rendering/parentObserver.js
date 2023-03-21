//Wrapper for IntersectionObserver
//Watches parent elements of nodes with matches
//On call indexes all visible matches into the mao and sends its containers into a callback
export class ParentObserver {
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

            while (container.IndexNextMatch(this.indexMap.size))
                this.indexMap.set(this.indexMap.size, container);
            container.AppendSelf();
            this.sendToProcessing(container);
        });
    }

    Observe(container) {
        this.observer.observe(container.parentNode);
    }

    StopObserving()
    {
        this.observer.disconnect();
    }
}