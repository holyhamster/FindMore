import SearchRegion from './searchRegion.js';
import {PerformanceTimer} from './performanceTimer.js';

//recursively searches DOM with SearchRegion, sends matches to highlighter

const consecutiveCalls = 200;   //caret moves before measuring performance
const recursionTimeLimit = 100;    //MS. set recursion on timeout each time if it takes longer
const timeoutDelay = 5; //MS, delay between recursion calls

class DomSearcher
{
    interrupted;
    

    constructor(_searchString, _regex, _eventElem, _highlighter)
    {
        setTimeout(() =>
        {
            const region = new SearchRegion(_searchString, _regex, _eventElem);
            this.search(region, _highlighter)
        }, 1);
    }

    interrupt()
    {
        this.interrupted = true;
    }

    search(_searchRegion, _highlighter, _executionTime = 0)
    {
        let WALK_IN_PROGRESS, callsLeft = consecutiveCalls;
        const measurer = new PerformanceTimer();

        while ((callsLeft -= 1) >= 0 && (WALK_IN_PROGRESS = _searchRegion.expand()))
        {
            const matches = _searchRegion.getMatches();
            if (this.interrupted)
                return;

            _highlighter.QueMatches(matches);
        }

        if (!WALK_IN_PROGRESS)
            return;

        if ((_executionTime += measurer.Get()) < recursionTimeLimit)
        {
            this.search(_searchRegion, _highlighter, _executionTime)
        }
        else
        {
            setTimeout(() =>
            {
                this.search(_searchRegion, _highlighter)
            }, timeoutDelay);
        }   
    }
}

export default DomSearcher;

