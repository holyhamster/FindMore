import SearchRegion from './searchRegion.js';

//recursively searches DOM, sends matches to highlighter
class DomSearcher
{
    interrupted;
    searchString;
    regexp;
    walker;

    matchesCount = 0;
    id;
    onNewMatches;
    
    selectedIndex;

    constructor(_id, _searchString, _regex, _onNewIFrames, _highlighter)
    {
        this.id = _id;
        this.searchString = _searchString;
        this.regexp = _regex;
        this.interrupted = false;

        setTimeout(function ()
        {
            let region = new SearchRegion(
                this.searchString, this.regexp, _onNewIFrames);
            this.searchRecursive(region, _highlighter)
        }.bind(this), this.interval);
    }

    interrupt()
    {
        this.interrupted = true;
    }

    interval = 1;
    consecutiveCalls = 100;
    searchRecursive(_searchRegion, _highlighter)
    {
        let callsLeft = this.consecutiveCalls;
        let range = document.createRange();
        let WALK_IN_PROGRESS = true;

        let matches = _searchRegion.getMatches(callsLeft);

        while (callsLeft >= 0 && WALK_IN_PROGRESS)
        {
            callsLeft -= 1;
            let match = matches.shift();
            if (match && _highlighter.addMatch(match, range))
                this.matchesCount += 1;

            if (matches.length == 0)
            {
                if (match)
                    _searchRegion.trimToPoint(match.endIndex, match.endOffset);

                if (callsLeft > 0)
                {
                    WALK_IN_PROGRESS = _searchRegion.addNextNode();
                    matches = _searchRegion.getMatches(callsLeft);
                }
            }
        }
        
        if (this.interrupted)
            return;
 
        _highlighter.commitDirtySpans();
        
        if (WALK_IN_PROGRESS)
            setTimeout(function (){
                this.searchRecursive.call(this, _searchRegion, _highlighter) }.bind(this),
                this.interval);
    }

    getCount()
    {
        return this.matchesCount;
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

