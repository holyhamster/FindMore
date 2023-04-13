import { PerformanceTimer } from '../performanceTimer'
import { Container } from './container';

//Wrapper for IntersectionObserver
//Watches container head elements, calculates and draws highlight rectangles in batches, callbacks on success

export class ContainerObserver {

    observer: IntersectionObserver;
    constructor(
        private elementMap: Map<Element, Container>) {
        this.observer = new IntersectionObserver((entries) => this.onObserve(entries));
    }

    public Observe(container: Container) {
        this.observer.observe(container.headElement);
    }

    public StopObserving() {
        this.observer.disconnect();
    }

    private onObserve(entries: IntersectionObserverEntry[]) {
        const range = document.createRange();
        const containers: Container[] = [];
        const timer = new PerformanceTimer();
        //Trigger removal of any old containers, so it would be done in the same reflow as drawing new ones

        entries.forEach(
            (entry: IntersectionObserverEntry) => {
                const headElement = entry.target;
                this.observer.unobserve(headElement);
                //if timer is over the limit, reinitiate observation
                if (!timer.IsUnder(observerMSLimit)) {
                    this.observer.observe(headElement);
                    return;
                }

                const container = this.elementMap.get(headElement.parentElement!);
                if (!container)
                    return;

                container.PrecalculateRectangles(range);
                containers.push(container);
            });

        containers.forEach((container) => container.AppendPrecalculated());
    }
}

//limit for a single observal cycle
const observerMSLimit = 100;