//Keeps track of time between creation and Get() calls

export class PerformanceTimer {
    constructor() {
        this.Reset();
    }

    lastMark = 0;
    totalMS = 0;
    Reset() {
        this.lastMark = performance.now();
    }

    Get(): number {
        const current = performance.now();
        const difference = current - this.lastMark;
        this.lastMark = current;
        return this.totalMS += difference;
    }

    IsUnder(ms: number): boolean {
        return this.Get() < ms;
    }
}