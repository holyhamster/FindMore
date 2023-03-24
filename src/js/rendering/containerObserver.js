import { PerformanceTimer } from '../performanceTimer.js'
import { ContainerRemoval } from './containerRemoval.js'

//Wrapper for IntersectionObserver
//Watches container head elements, calculates and draws highlight rectangles in batches, callbacks on success

export class ContainerObserver {
    constructor(nodeMap, onNewMatches) {
        this.nodeMap = nodeMap;
        this.onNewMatches = onNewMatches;

        this.observer = new IntersectionObserver((entries) => this.onObserve(entries));
    }

    Observe(container) {
        this.observer.observe(container.headElement);
    }
    StopObserving() {
        this.observer.disconnect();
    }

    onObserve(entries) {
        const range = document.createRange();
        const containers = [];
        const timer = new PerformanceTimer();
        //Trigger removal of any old containers, so it would be done in the same reflow as drawing new ones
        ContainerRemoval.Trigger();
        entries.forEach((entry) => {
            const headElement = entry.target;
            this.observer.unobserve(headElement);
            if (timer.Get() > observerMSLimit) {
                this.observer.observe(headElement);
                return;
            }

            const container = this.nodeMap.get(headElement.parentNode);
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