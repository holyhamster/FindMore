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

    constructor(_id, _searchString, _regex, _iframeCSSEvent, _highlighter)
    {
        this.id = _id;
        this.searchString = _searchString;
        this.regexp = _regex;
        this.interrupted = false;

        setTimeout(function ()
        {
            let region = new SearchRegion(getTreeWalk(_iframeCSSEvent), this.searchString, this.regexp);
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
            {
                this.matchesCount += 1;
            }

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

const treeWalkerCondition = {
    acceptNode: (node) =>
    {
        if (node.nodeName.toUpperCase() == "IFRAME")
            return NodeFilter.FILTER_ACCEPT;

        if (node.nodeName.toUpperCase() == "STYLE" ||
            node.nodeName.toUpperCase() == "SCRIPT")
            return NodeFilter.FILTER_REJECT;

        if (node.nodeType == Node.ELEMENT_NODE)
        {
            let classes = node.id.toString().split(/\s+/);
            let NODE_IS_SEARCHBAR_SHADOWROOT = classes.includes(`TFShadowRoot`);
            if (NODE_IS_SEARCHBAR_SHADOWROOT)
                return NodeFilter.FILTER_REJECT;
        }

        if (node.nodeName.toUpperCase() == "#TEXT" && node.textContent)
            return NodeFilter.FILTER_ACCEPT;

        return NodeFilter.FILTER_SKIP;
    }
};

function getTreeWalk(_onNewIFrame)
{
    let treeWalker = document.createTreeWalker(
        document.body, NodeFilter.SHOW_ALL, treeWalkerCondition);
    treeWalker.que = [treeWalker];

    treeWalker.nextNodePlus = function ()
    {
        if (this.que.length == 0)
            return null;

        let nextNode = this.que.slice(-1)[0].nextNode();

        if (!nextNode)
        {
            this.que.pop();
            //console.log(`surfacing back to ${this.que.length}-level frame`);
            return this.nextNodePlus();
        }

        if (nextNode.nodeName.toUpperCase() == 'IFRAME' &&
            nextNode.contentDocument)
        {
            let iframeDoc = nextNode.contentDocument;
            let iframeWalker = iframeDoc.createTreeWalker(
                iframeDoc.body, NodeFilter.SHOW_ALL, treeWalkerCondition);
            _onNewIFrame(nextNode);
            this.que.push(iframeWalker);
            //console.log(`diving deeper into ${this.que.length}-level frame`);
            return this.nextNodePlus();
        }

        return nextNode;
    };
    return treeWalker;
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

