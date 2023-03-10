import Container from './container.js';
import PerfMeasurer from './perfMeasurer.js';

const recursionTimeLimit = 100;    //MS. set recursion on timeout each time if it takes longer
const timeoutDelay = 5; //MS, delay between recursion calls

//accepts matches and transforms them into highlight elements
class Highlighter
{
    constructor(_id, _eventElem, _primaryColor, _secondaryColor )
    {
        this.id = _id;
        this.parentElement = _eventElem;

        const newMatchesEvent = new Event(`tf-new-matches-update`);
        this.onNewMatches = (_newMatchCount) =>
        {
            newMatchesEvent.length = _newMatchCount;
            _eventElem.dispatchEvent(newMatchesEvent);
        };
    }

    //#region RECURSIVE HIGHLIGHT 

    matches = [];       //que of DOMSearcher matches for processing
    containers = [];    //processed matches
    invoked;
    queMatches(_matches)
    {
        this.matches = [...this.matches, ..._matches];
        this.interrupted = false;
        if (this.invoked)
            return;

        this.invoked = true;
        setTimeout(() => { this.processHighlights() }, 1);
    }

    interrupted;
    consequtiveCalls = 100;
    processHighlights()
    {
        const perfMeasurer = new PerfMeasurer();
        let totalTime = 0;
        const range = document.createRange(), dirtyContainers = [];

        this.invoked = false;
        
        while ((totalTime += perfMeasurer.get()) < recursionTimeLimit && (this.matches.length > 0) && !this.interrupted)
        {
            
            const match = this.matches.shift();
            const container = this.createContainer(match, range);
            if (container)
            {
                this.containers.push(container);
                if (!dirtyContainers.includes(container))
                    dirtyContainers.push(container);
            }
        }

        if (!this.interrupted)
        {
            dirtyContainers.forEach((_container) => { _container.commit(); })
            if (dirtyContainers.length > 0)
                this.onNewMatches(this.getMatchCount());
        }

        this.removeOldContainers();
        

        if (!this.invoked && !this.interrupted && this.matches.length > 0)
        {
            this.invoked = true;
            setTimeout(() => { this.processHighlights() }, timeoutDelay);
        }
    }

    nodeToContainerMap = new Map(); //map of container spans that hold highlighted rectangles to their parent nodes
    createContainer(_match, _range)
    {
        const rects = this.getHighlightRectangles(_match, _range);

        let hlContainer = this.nodeToContainerMap.get(_match.endNode.parentNode);
        if (!hlContainer)
        {
            hlContainer = new Container(_match.endNode.parentNode, this.id);
            this.nodeToContainerMap.set(_match.endNode.parentNode, hlContainer);
        }

        const highlightID = this.containers.length;
        const visible = hlContainer.highlightRects(highlightID, rects);

        if (visible)
            return hlContainer;

        return;
    }

    getHighlightRectangles(_match, _range)
    {
        
        _range.setStart(_match.startNode, _match.startOffset);
        _range.setEnd(_match.endNode, _match.endOffset);

        const rects = Array.from(_range.getClientRects()), nonEmptyRects = [];
        while (rects.length > 0)
        {
            const rect = rects.shift();
            if (rect.width >= 1 && rect.height >= 1)
                nonEmptyRects.push(rect);
        }

        return nonEmptyRects;
    }
    //#endregion

    getMatchCount(_includeUnprocessed = true)
    {
        return this.containers.length + (_includeUnprocessed ? this.matches.length: 0);
    }

    accentMatch(_index)
    {
        if (_index === this.accentedIndex)
            return;
        const lastAccentedContainer = this.containers[this.accentedIndex];

        if (lastAccentedContainer)
        {
            lastAccentedContainer.setSelectionAt(this.accentedIndex, false);
            this.accentedIndex = null;
        }
        if (isNaN(_index))
            return;

        let focusTarget;
        if (_index < this.containers.length)
        {
            this.accentedIndex = _index;
            const accentedRectangles = this.containers[this.accentedIndex].setSelectionAt(_index, true);
            focusTarget = accentedRectangles.length > 0 ? accentedRectangles[0] : null;
        }
        else if (_index < this.containers.length + this.matches.length)
        {
            const match = this.matches[_index - this.containers.length];
            focusTarget = match?.startNode.parentNode;
        }

        if (!focusTarget)
            return;

        this.intersectionObserver = this.intersectionObserver ||
            new IntersectionObserver(entries => 
            {
                if (!entries[0].isIntersecting)
                    entries[0].target.scrollIntoView({ block: "center" });
                this.intersectionObserver.unobserve(entries[0].target)
            });

        this.intersectionObserver.observe(focusTarget);
    }

    oldContainers = [];
    clearSelection()
    {
        this.interrupted = true;
        this.oldContainers = [...this.oldContainers, ...Array.from(this.nodeToContainerMap.values())];

        setTimeout(() => this.removeOldContainers(), 100);
        
        this.matches = [];
        this.containers = [];
        this.nodeToContainerMap = new Map();
    }
    removeOldContainers()
    {
        let container;
        while (container = this.oldContainers.shift())
            container.remove();
    }
}


function roundToLeftDigit(_number)
{
    return _number.toString()[0] + "0".repeat(_number.toString().length - 1)
}
export default Highlighter;