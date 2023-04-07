import { PerformanceTimer } from '../performanceTimer'
import { Container } from './container';
import { ContainerRemoval } from './containerRemoval'

//Wrapper for IntersectionObserver
//Watches container head elements, calculates and draws highlight rectangles in batches, callbacks on success

export class ContainerObserver {
    observer: IntersectionObserver;
    constructor(
        private nodeMap: Map<Element, Container>,
        private onNewMatches: () => void) {

        this.observer = new IntersectionObserver((entries) => this.onObserve(entries));
    }

    Observe(container: Container) {
        this.observer.observe(container.headElement);
    }
    StopObserving() {
        this.observer.disconnect();
    }

    onObserve(entries: IntersectionObserverEntry[]) {
        const range = document.createRange();
        const containers: Container[] = [];
        const timer = new PerformanceTimer();
        //Trigger removal of any old containers, so it would be done in the same reflow as drawing new ones
        ContainerRemoval.Trigger();
        entries.forEach((entry) => {
            const headElement = entry.target;
            this.observer.unobserve(headElement);
            if (!timer.IsUnder(observerMSLimit)) {
                this.observer.observe(headElement);
                return;
            }

            const container = this.nodeMap.get(headElement.parentElement!);
            if (!container)
                return;
            containers.push(container);
            container.PrecalculateRectangles(range);
        });

        containers.forEach((container) => {
            container.AppendPrecalculated();
        });
        this.onNewMatches();
    }
    
}

//limit for a single observal cycle
const observerMSLimit = 100;