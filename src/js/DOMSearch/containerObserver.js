import { PerformanceTimer } from './performanceTimer.js'

//Wrapper for IntersectionObserver
//On call calculates and draws containers in batches
//Static function ascynchronously handles removal of old containers
export class ContainerObserver {
    constructor(nodeMap, onNewMatches) {
        this.nodeMap = nodeMap;
        this.onNewMatches = onNewMatches;

        this.observer = new IntersectionObserver((entries) => this.onObserve(entries));
    }

    onObserve(entries) {
        const range = document.createRange();
        const containers = [];
        const timer = new PerformanceTimer();

        ContainerObserver.removeOldContainers();
        entries.forEach((entry) => {
            const headElement = entry.target;
            this.observer.unobserve(headElement);
            if (timer.Get() > observerTimeLimit) {
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
    Observe(container) {
        this.observer.observe(container.headElement);
    }
    StopObserving() {
        this.observer.disconnect();
    }

    static removeQue;
    static QueForRemoval(containers) {
        ContainerObserver.removeQue = ContainerObserver.removeQue || [];
        ContainerObserver.removeQue = [...ContainerObserver.removeQue, ...containers];

        setTimeout(() => ContainerObserver.removeOldContainers(), 100);
    }

    static removeOldContainers() {
        const timer = new PerformanceTimer();
        let container;
        while ((timer.Get() < removalTimeLimit) && (container = ContainerObserver.removeQue?.shift()))
            container.remove();

        if (ContainerObserver.removeQue?.length > 0)
            setTimeout(() => ContainerObserver.removeOldContainers(), removalTimeDelay);
    }
}

const removalTimeLimit = 150;
const removalTimeDelay = 10;
const observerTimeLimit = 100;