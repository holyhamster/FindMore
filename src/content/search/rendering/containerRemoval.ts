import { PerformanceTimer } from '../performanceTimer'
import { Container } from './container';

//Asymchronously removes old containers. Shared between all page searches.
export class ContainerRemoval {
    private static array: Container[];
    private static triggered: boolean;

    static Que(containers: Container[]) {
        this.array = [...(this.array || []), ...containers];

        if (!this.triggered)
            setTimeout(() => this.Trigger(), initialMSDelay);
        this.triggered = true;
    }

    static Trigger() {
        
        const timer = new PerformanceTimer();
        let i = 0;
        while (timer.IsUnder(msLimit) && i < this.array.length) {
            this.array[i].Remove();
            i++;
        }
        this.array = this.array?.slice(i, -1);

        this.triggered = this.array.length > 0;
        if (this.triggered)
            setTimeout(() => this.Trigger(), msDelay);
    }
}

//limit for single cycle of old highlights removal
const msLimit = 150;
//delay between cycles
const msDelay = 10;
//wait before starting removal cycle (for better transition between searches)
const initialMSDelay = 100;