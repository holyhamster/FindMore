import { PerformanceTimer } from '../performanceTimer'
import { Container } from './container';

//Static class that asymchronously removes old containers, shared between all page searches

export class ContainerRemoval {
    static array: Container[];
    static Que(containers: Container[]) {
        ContainerRemoval.array = ContainerRemoval.array || [];
        ContainerRemoval.array = [...ContainerRemoval.array, ...containers];

        setTimeout(() => ContainerRemoval.Trigger(), removalInitialMSDelay);
    }

    static Trigger() {
        const timer = new PerformanceTimer();
        let container;
        while ((timer.IsUnder(removalMSLimit)) && (container = ContainerRemoval.array?.shift()))
            container.Remove();

        if (ContainerRemoval.array?.length > 0)
            setTimeout(() => ContainerRemoval.Trigger(), removalMSDelay);
    }
}

//limit for single cycle of old highlights removal
const removalMSLimit = 150;
//delay between cycles
const removalMSDelay = 10;
//wait before starting removal cycle (for better transition between searches)
const removalInitialMSDelay = 100;
//limit for a single observal cycle