import HighlightGroup from './highlightGroup.js';
import SearchRegion from './searchRegion.js';

class DomSearcher
{
    interrupted;
    searchString;
    regexString;
    interval = 1;
    consecutiveCalls = 100;
    DEBUG_MESSAGES;
    matchArray;
    matchArrayBuffer; //holds
    id;
    onNewMatches;

    constructor(_id, _searchString, _regexOptions)
    {
        this.id = _id;

        this.onNewMatches = new Event(`TF-matches-update${this.id}`);
        
        this.regexString = new RegExp(_searchString, 'gi');

        this.interrupted = false;
        this.searchString = _searchString;
        this.DEBUG_MESSAGES = true;

        this.regexp = new RegExp(_searchString, _regexOptions);
        this.matchArray = [];
        this.startSearch();
        
        //this.searchRecursion(
        //this.getWalk(), new RegExp(_searchString, _regexOptions), "", [], 0);
    }

    interrupt()
    {
        console.log("interrupt triggered");
        this.interrupted = true;
    }
    startSearch()
    {
        //this.showNodes()
        
        setTimeout(function ()
        {
            let region = new SearchRegion(this.getWalk(), this.searchString, this.regexString);
            this.searchRecursive(region, [], new Map())
        }.bind(this), this.interval);
        
    }
    //iterates through a search region, continues pulling new nodes out of this.walk when search fails
    //makes a timeout everytime it makes too many calls at once (to give the browser some rendering time)
    //
    //_regionNodes are all nodes in the current search region, _regionString is their stacked .contentText starting from _regionOffset index
    showNodes()
    {
        let dogg = document.createTreeWalker(document.body, NodeFilter.SHOW_ALL);
        let node;
        while (node = dogg.nextNode())
        {
            console.log(node);
        }
    }
    searchRecursive(_searchRegion, _matches, _highlightGroups)
    {
        let callsLeft = this.consecutiveCalls;
        let range = document.createRange();
        let dirtyHLGroups = new Map();

        while (callsLeft >= 0)
        {
            callsLeft -= 1;
            if (_matches.length > 0)
            {
                let match = _matches.shift();
                this.matchArray.push(match);
                let newHL = this.processMatch(match, _searchRegion, range, _highlightGroups);
                if (newHL && !dirtyHLGroups.get(newHL))
                    dirtyHLGroups.set(newHL.parent, newHL.group);

                if (_matches.length == 0)
                    _searchRegion.trimToPoint(match.endIndex, match.endOffset);
            }
            else
            {
                _matches = _searchRegion.getMatches(callsLeft);
                if (_matches.length == 0)  //try basing this on offset <<--???
                {
                    let WALK_IN_PROGRESS = _searchRegion.addNextNode();

                    if (!WALK_IN_PROGRESS)
                    {
                        dirtyHLGroups.forEach(function (_hlGroup) { _hlGroup.commit(); });
                        console.log("end of tree");
                        return;
                    }
                    _matches = _searchRegion.getMatches(callsLeft);
                }
            }
        }

        if (_matches.length != 0)
            console.log("DANGER, UNHANDLED MATCHES")

        if (this.interrupted)
            return;

        dirtyHLGroups.forEach(function (_hlGroup) { _hlGroup.commit(); });

        this.onNewMatches.matches = this.matchArray;
        document.dispatchEvent(this.onNewMatches);
        setTimeout(function ()
        {
            this.searchRecursive.call(
                this, _searchRegion, _matches, _highlightGroups)
        }.bind(this), this.interval);
    }

    static initRegion()
    {
        let region = new Object();
        region.string = "";
        region.nodes = [];
        region.offset = 0;
        return region;
    }


    processMatch(_match, _region, _range, _highlightGroups)
    {
        let parentNode = _region.nodes[_match.endIndex].parentNode;

        let hlGroup = (_highlightGroups.get(parentNode));
        if (!hlGroup)
        {
            hlGroup = new HighlightGroup(parentNode, _range, this.id);
            _highlightGroups.set(parentNode, hlGroup);

        }
        if (!hlGroup.isGroupVisibleAfterUpdate(_range))
            return;

        _range.setStart(_region.nodes[_match.startIndex], _match.startOffset);
        _range.setEnd(_region.nodes[_match.endIndex], _match.endOffset);

        hlGroup.highlightRange(_range);

        return { parent: parentNode, group: hlGroup };
    }

    getWalk()
    {
        const condition = {
            acceptNode: (node) =>
            {
                if (node.nodeName.toUpperCase() == "STYLE" ||
                    node.nodeName.toUpperCase() == "SCRIPT")
                {
                    return NodeFilter.FILTER_REJECT
                }
                if (node.nodeName.toUpperCase() == "#TEXT" &&
                    node.textContent)
                    return NodeFilter.FILTER_ACCEPT;

                return NodeFilter.FILTER_SKIP;
            }

        };
        return document.createTreeWalker(document.body, NodeFilter.SHOW_ALL, condition);
    }
}

export default DomSearcher;

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