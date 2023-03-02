import SearchRegion from './searchRegion.js';
import PerformanceMeasurer from './performanceMeasurer.js';

//recursively searches DOM, sends matches to highlighter
class DomSearcher
{
    interrupted;
    searchString;
    regexp;
    walker;

    hitCount = 0; //not all hits will be visible
    onNewMatches;
    
    selectedIndex;

    constructor(_searchString, _regex, _eventElem, _highlighter)
    {
        setTimeout(() =>
        {
            const region = new SearchRegion(_searchString, _regex, _eventElem);
            this.search(region, _highlighter)
        }, this.interval);
    }

    interrupt()
    {
        this.interrupted = true;
    }

    search(_searchRegion, _highlighter, _executionTime = 0)
    {
        const sleepInterval = 5, consecutiveCalls = 200, msInterrupt = 200;
        let WALK_IN_PROGRESS, callsLeft = consecutiveCalls;
        const measurer = new PerformanceMeasurer();

        while ((callsLeft -= 1) >= 0 && (WALK_IN_PROGRESS = _searchRegion.expand()))
        {
            const matches = _searchRegion.getMatches();
            if (this.interrupted)
                return;

            _highlighter.queMatches(matches);
        }

        if (!WALK_IN_PROGRESS)
            return;
        _executionTime = _executionTime + measurer.get();
        if (_executionTime < msInterrupt)
        {
            this.search(_searchRegion, _highlighter, _executionTime)
        }
        else
        {
            setTimeout(() =>
            {
                this.search(_searchRegion, _highlighter)
            }, sleepInterval);
        }   
    }
}





export default DomSearcher;

