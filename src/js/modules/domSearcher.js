import SearchRegion from './searchRegion.js';

//recursively searches DOM, sends matches to highlighter
class DomSearcher
{
    interrupted;
    searchString;
    regexp;
    walker;

    hitCount = 0; //not all hits will be visible
    id;
    onNewMatches;
    
    selectedIndex;

    constructor(_id, _searchString, _regex, _eventElem, _highlighter)
    {
        this.id = _id;
        this.searchString = _searchString;
        this.regexp = _regex;
        this.interrupted = false;

        setTimeout(function ()
        {
            let region = new SearchRegion(this.searchString, this.regexp, _eventElem);
            this.search(region, _highlighter)
        }.bind(this), this.interval);
    }

    interrupt()
    {
        this.interrupted = true;
    }

    search(_searchRegion, _highlighter)
    {
        const sleepInterval = 5, consecutiveCalls = 1000;
        let WALK_IN_PROGRESS, callsLeft = consecutiveCalls;

        while ((callsLeft -= 1) >= 0 && (WALK_IN_PROGRESS = _searchRegion.expand()))
        {
            callsLeft -= 1;
            const matches = _searchRegion.getMatches(callsLeft);
            matches.forEach((_match) => _highlighter.queMatch(_match));
            this.hitCount += matches.length;
        }
        
        if (!this.interrupted && WALK_IN_PROGRESS)
            setTimeout(function (){
                this.search.call(this, _searchRegion, _highlighter) }.bind(this),
                sleepInterval);
    }
}



class PerformanceMesurer
{
    constructor()
    {
        this.last = performance.now();
    }

    get()
    {
        let val = performance.now() - this.last;
        this.last = performance.now();
        return val;
    }
}

export default DomSearcher;

