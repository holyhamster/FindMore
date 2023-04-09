import { SearchRegion } from './searchRegion';
import { PerformanceTimer } from '../performanceTimer';
import { Highlighter } from '../rendering/highlighter.js';

//Goes recursively through SearchRegion, sends matches to Highlighter

export class DOMCrawler {

    constructor(
        searchString: string,
        regex: RegExp,
        eventElem: Element,
        highlighterRef: Highlighter) {
        setTimeout(() => this.search(new SearchRegion(searchString, regex, eventElem), highlighterRef), 1);
    }

    interrupted = false;
    public Interrupt() {
        this.interrupted = true;
    }

    private search(searchRegion: SearchRegion, highlighter: Highlighter, executionTime = 0) {
        let WALK_IN_PROGRESS, callsLeft = consecutiveCalls;
        const measurer = new PerformanceTimer();

        while (!this.interrupted && (callsLeft -= 1) >= 0 &&
            (WALK_IN_PROGRESS = searchRegion.TryExpand())) {
            const matches = searchRegion.GetMatches();
            if (matches?.length > 0)
                highlighter.QueMatches(matches);
        }

        if (!WALK_IN_PROGRESS)
            return;

        if ((executionTime += measurer.Get()) < recursionTimeLimit)
            this.search(searchRegion, highlighter, executionTime)
        else 
            setTimeout(() => this.search(searchRegion, highlighter), DelayTime);
    }
}

const consecutiveCalls = 200;       //Search region expand calls before checking for performance
const recursionTimeLimit = 100;     //Time limit to inject a delay
const DelayTime = 5;