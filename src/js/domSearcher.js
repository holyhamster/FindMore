import HighlightGroup from './highlightGroup.js';
import SearchRegion from './searchRegion.js';

class DomSearcher
{
    interrupted;
    searchString;
    regexp;
    interval = 1;
    consecutiveCalls = 100;
    matchArray = [];
    id;
    onNewMatches;

    selectedIndex;

    constructor(_id, _searchString, _regexOptions)
    {
        this.id = _id;
        this.searchString = _searchString;

        this.regexp = new RegExp(_searchString, _regexOptions);
        this.interrupted = false;

        this.onNewMatches = new Event(`TF-matches-update${this.id}`);

        
        

        
        this.startSearch();
        
    }

    interrupt()
    {
        this.interrupted = true;
    }

    startSearch()
    {
        //this.showNodes()
        
        setTimeout(function ()
        {
            let region = new SearchRegion(this.getWalk(), this.searchString, this.regexp);
            this.searchRecursive(region, new Map())
        }.bind(this), this.interval);
        
    }

    showNodes()
    {
        let dogg = document.createTreeWalker(document.body, NodeFilter.SHOW_ALL);
        let node;
        while (node = dogg.nextNode())
        {
            console.log(node);
        }
    }
    searchRecursive(_searchRegion, _highlightGroups)
    {
        let callsLeft = this.consecutiveCalls;
        let range = document.createRange();
        let newHighlights = [];

        let matches = _searchRegion.getMatches(callsLeft);
        while (callsLeft >= 0)
        {
            callsLeft -= 1;

            let match = matches.shift();
            if (match)
            {
                let newHL = this.processMatch(match, _searchRegion, range, _highlightGroups);
                if (newHL && !newHighlights.includes(newHL))
                    newHighlights.push(newHL);
            }

            if (matches.length == 0)
            {
                if (match)
                    _searchRegion.trimToPoint(match.endIndex, match.endOffset);

                let WALK_IN_PROGRESS = _searchRegion.addNextNode();

                if (!WALK_IN_PROGRESS)
                    break;

                matches = _searchRegion.getMatches(callsLeft);
            }
        }

        if (matches.length > 0)
            console.log("ERROR, UNPROCESSED MATCHES");

        if (this.interrupted)
            return;

        if (newHighlights.length > 0)
            document.dispatchEvent(this.onNewMatches);

        for (let i = 0; i < newHighlights.length; i++)
            newHighlights[i].commit();
        
        setTimeout(function ()
        {
            this.searchRecursive.call(
                this, _searchRegion, _highlightGroups)
        }.bind(this), this.interval);
    }

    selectHighlight(_index)
    {
        if (this.selectedIndex != null)
        {
            this.matchArray[this.selectedIndex].resetSelection(this.selectedIndex);
        }

        this.selectedIndex = _index;
        this.matchArray[this.selectedIndex].container.scrollIntoView();
        this.matchArray[this.selectedIndex].selectAt(_index);
    }

    getMatches()
    {
        return this.matchArray;
    }

    processMatch(_match, _region, _range, _highlightGroups)
    {
        let nonEmptyRects = this.getValidRects(_match, _region, _range);

        let parentNode = _region.nodes[_match.endIndex].parentNode;
        let hlGroup = _highlightGroups.get(parentNode);
        if (!hlGroup)
        {
            hlGroup = new HighlightGroup(parentNode, _range, this.id);
            _highlightGroups.set(parentNode, hlGroup);
        }

        //if (!hlGroup.isGroupVisibleAfterUpdate(_range))
          //  return;

        let highlighted = hlGroup.highlightRects(this.matchArray.length, nonEmptyRects);

        if (highlighted)
            this.matchArray.push(hlGroup);

        return hlGroup;
    }
    getValidRects(_match, _region, _range)
    {
        _range.setStart(_region.nodes[_match.startIndex], _match.startOffset);
        _range.setEnd(_region.nodes[_match.endIndex], _match.endOffset);

        let nonEmptyRects = [], rects = _range.getClientRects();

        for (let i = 0; i < rects.length; i++)
            if (rects[i].width >= 1 && rects[i].height >= 1)
                nonEmptyRects.push(rects[i]);

        return nonEmptyRects;
    }
    getWalk()
    {
        const condition = {
            acceptNode: (node) =>
            {
                
                //classString.split(' ');
                if (node.nodeName.toUpperCase() == "STYLE" ||
                    node.nodeName.toUpperCase() == "SCRIPT")
                {
                    return NodeFilter.FILTER_REJECT
                }
                if (node.nodeType == Node.ELEMENT_NODE)
                {
                    let classes = node.className.toString().split(/\s+/);
                    if (classes.includes(`TFSearchBar`))
                    {
                        return NodeFilter.FILTER_REJECT
                    }
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