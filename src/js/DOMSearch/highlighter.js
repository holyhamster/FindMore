import Container from './container.js';
import PerfMeasurer from './perfMeasurer.js';

//accepts matches and transforms them into highlight elements
//Happens in four asynchronous stages to optimize browser's reflow calls:
// - queMatches() synchronously from DOMSearcher
// - processMatches() recursively creates/finds a container for each match, makes a delay if execution is too long
// - nodeObserver asynchronously decides if the parent node of the match is visible, appends the container
// - containerObserver asynchronously calculates all rectangles, appends them to the container

const processingTimeLimit = 100;    //MS
const processingTimeDelay = 5;
const removalTimeLimit = 150;
const removalTimeDelay = 10;

class Highlighter
{
    constructor(id, eventElement)
    {
        this.id = id;

        const newMatchesEvent = new Event(`fm-new-matches-update`);
        this.onNewMatches = () =>
        {
            newMatchesEvent.length = this.getMatchCount();
            eventElement.dispatchEvent(newMatchesEvent);
        };

    }

    //#region RECURSIVE HIGHLIGHT 
    matches = [];       //que of DOMSearcher matches for processing
    invoked;
    queMatches(matches)
    {
        this.matches = [...this.matches, ...matches];
        if (this.invoked)
            return;

        this.invoked = true;
        setTimeout(() => { this.processMatches() }, 1);
    }


    consequtiveCalls = 100;
    indexToContainerMap = new Map(); //containers by search index
    nodeToContainerMap = new Map(); //containers by the parent nodes of their head elements

    processMatches()
    {
        this.invoked = false;
        const perfMeasurer = new PerfMeasurer();
        let totalTime = 0;

        if (this.containerObserver == null)
            this.containerObserver = this.getContainerObserver(this.nodeToContainerMap, () => this.onNewMatches());
        if (this.nodeObserver == null)
            this.nodeObserver = this.getNodeObserver(this.nodeToContainerMap, this.indexToContainerMap,
                                    (element) => { this.containerObserver.observe(element) });

        while ((totalTime += perfMeasurer.get()) < processingTimeLimit &&
            this.matches.length > 0)
        {
            const container = this.getContainer(this.matches.shift());
            this.nodeObserver.observe(container.parentNode);
        }

        if (this.matches.length > 0 && !this.invoked)
        {
            this.invoked = true;
            setTimeout(() => { this.processMatches() }, processingTimeDelay);
        }
    }

    getContainer(match)
    {
        const parentNode = match.endNode.parentNode;
        let container = this.nodeToContainerMap.get(parentNode);
        if (!container)
        {
            container = new Container(parentNode, this.id);
            this.nodeToContainerMap.set(parentNode, container);
        }

        container.queMatch(match);
        return container;
    }

    //observes parents of nodes with matches, appends the visible ones and sends them to processing
    getNodeObserver(nodeMap, indexMap, passToProcessing)
    {
        const onObserve = (entries) => 
        {
            entries.forEach((entry) =>
            {
                const container = nodeMap.get(entry.target);
                observer.unobserve(entry.target);

                const elementVisible =
                    entry.boundingClientRect.width > 2 && entry.boundingClientRect.height > 2;

                if (!elementVisible)
                    return;

                while (container.indexNextMatch(indexMap.size))
                {
                    indexMap.set(indexMap.size, container);
                }
                container.appendSelf();

                passToProcessing(container.headElement);
            });
        };

        var observer = new IntersectionObserver(onObserve);

        return observer;
    }

    //observes containers of successful matches,
    getContainerObserver(nodeMap, onNewMatches)
    {
        const observer = new IntersectionObserver((_entries) =>
        {
            this.removeOldContainers();

            const range = document.createRange();
            const containers = [];

            _entries.forEach((_entry) =>
            {
                const headElement = _entry.target;
                observer.unobserve(headElement);

                const container = nodeMap.get(headElement.parentNode);
                containers.push(container);
                container.precalculateRectangles(headElement.getBoundingClientRect(), range);
            });

            containers.forEach((_container) =>
            {
                _container.finalize();
            });
            onNewMatches();
        });
        return observer;
    }
    //#endregion

    getMatchCount(includeUnprocessed = true)
    {
        return this.indexToContainerMap.size + (includeUnprocessed ? this.matches.length : 0);
    }

    getNewClosestMatch()
    {
        //TODO: reference old accent/screenposition
        return this.getMatchCount() > 0 ? 0 : null;
    }

    accentMatch(index)
    {
        if (index === this.accentedIndex)
            return;

        const lastAccentedContainer = this.indexToContainerMap.get(this.accentedIndex);
        if (lastAccentedContainer)
        {
            lastAccentedContainer.setAccent(this.accentedIndex, false);
            this.accentedIndex = null;
        }

        if (isNaN(index) || index < 0 || (this.indexToContainerMap.size + this.matches.length) == 0)
            return;

        if (!this.focusObserver)
            this.focusObserver = new IntersectionObserver(entries => 
            {
                entries.forEach((entry) =>
                {
                    this.focusObserver.unobserve(entry.target);
                    if (!entry.isIntersecting)
                        entry.target.scrollIntoView({ block: "center" });
                });
            });

        const focusTarget = this.getFocusTargetAt(index);
        if (focusTarget)
            this.focusObserver.observe(focusTarget);
        return;
    }

    getFocusTargetAt(index)
    {
        if (index < this.indexToContainerMap.size)
        {
            this.accentedIndex = index;
            const accentedRectangles = this.indexToContainerMap.get(index)?.setAccent(index, true);
            return accentedRectangles?.length > 0 ? accentedRectangles[0] : null;
        }

        index -= this.indexToContainerMap.size;
        return this.matches[index]?.startNode?.parentNode;
    }

    containersToRemove = [];
    clearSelection()
    {
        this.nodeObserver?.disconnect();
        this.nodeObserver = null;
        this.containerObserver?.disconnect();
        this.containerObserver = null;

        this.containersToRemove = [...this.containersToRemove, ...Array.from(this.nodeToContainerMap.values())];
        setTimeout(() => this.removeOldContainers(), 100);

        this.matches = [];
        this.indexToContainerMap = new Map();
        this.nodeToContainerMap = new Map();
    }
    //removal of old highlights, recursive for performance reasons
    removeOldContainers()
    {
        const perf = new PerfMeasurer();
        let container, timer = 0;
        while (((timer += perf.get()) < removalTimeLimit) &&
            (container = this.containersToRemove.shift()))
            container.remove();

        if (this.containersToRemove.length > 0)
            setTimeout(() => this.removeOldContainers(), removalTimeDelay);
    }
}


function roundToLeftDigit(_number)
{
    return _number.toString()[0] + "0".repeat(_number.toString().length - 1)
}
export default Highlighter;