import { PerformanceTimer } from '../performanceTimer.js'
import { ContainerRemoval } from './containerRemoval.js'

//Wrapper for IntersectionObserver
//On call calculates and draws containers in batches
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

        ContainerRemoval.Remove()
        entries.forEach((entry) => {
            const headElement = entry.target;
            this.observer.unobserve(headElement);
            if (timer.Get() > observerMSLimit) {
                this.observer.observe(headElement);
                return;
            }

            const container = this.nodeMap.get(headElement.parentNode);
            containers.push(container);
            container.precalculateRectangles(range);
        });

        containers.forEach((container) => {
            container.finalize();
        });
        this.onNewMatches();
    }
    
}

//limit for a single observal cycle
const observerMSLimit = 100;