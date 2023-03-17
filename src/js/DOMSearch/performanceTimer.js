
class PerformanceTimer {
    constructor() {
        this.Reset();
    }

    Get() {
        const current = performance.now();
        const difference = current - this.last;
        this.last = current;
        return this.total += difference;
    }

    Reset() {
        this.last = performance.now();
        this.total = 0;
    }
}

export default PerformanceTimer;