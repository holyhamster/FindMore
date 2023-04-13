import { Container } from './container';

//Wrapper for IntersectionObserver
//Watches parent elements of nodes with matches
//Determines if they're visile, indexes into the map and callbacks with containers on success.

export class ParentObserver {
    observer: IntersectionObserver;
    constructor(
        private nodeMap: Map<Element, Container>,
        private indexMap: Map<number, Container>,
        private sendToProcessing: (container: Container) => void,
        private onNewMatches: (newMatches: number, total: number) => void) {
        this.observer = new IntersectionObserver((entries) => this.onObserve(entries));
    }

    private onObserve(entries: IntersectionObserverEntry[]) {

        const visibleContainers: Container[] = [];
        entries.forEach((entry: IntersectionObserverEntry) => {
            this.observer.unobserve(entry.target);
            const container = this.nodeMap.get(entry.target);
            if (container && isEntryVisible(entry))
                visibleContainers.push(container);
        });
        const oldSize = this.indexMap.size;
        visibleContainers.forEach((container) => {
            while (container.IndexNextMatch(this.indexMap.size))
                this.indexMap.set(this.indexMap.size, container);
            container.AppendSelf();
            this.sendToProcessing(container);
        });
        this.onNewMatches(this.indexMap.size - oldSize, this.indexMap.size);
    }

    public Observe(parentElement: Element) {
        this.observer.observe(parentElement);
    }

    StopObserving()
    {
        this.observer.disconnect();
    }
}

function isEntryVisible(entry: IntersectionObserverEntry) {
    const parentStyle = window.getComputedStyle(entry.target);
    return entry.boundingClientRect.width > 1 && entry.boundingClientRect.height > 1 &&
        parentStyle.visibility !== 'hidden' && parentStyle.display !== 'none';
}