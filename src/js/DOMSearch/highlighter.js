import Container from './container.js';
import { ContainerObserver } from './containerObserver.js';
import { NodeObserver } from './nodeObserver.js';
import { PerformanceTimer } from './performanceTimer.js';
import { GetNewMatchesEvent } from '../search.js';

//accepts matches and transforms them into highlight elements
//Happens in four asynchronous stages to optimize browser's reflow calls:
// - queMatches() synchronously from DOMSearcher
// - processMatches() recursively creates/finds a container for each match, makes a delay if execution is too long
// - nodeObserver asynchronously decides if the parent node of the match is visible, appends the container
// - containerObserver asynchronously calculates all rectangles, appends them to the container
class Highlighter {
    constructor(id) {
        this.id = id;
    }

    //#region RECURSIVE HIGHLIGHT 
    matches = [];       //que of DOMSearcher matches for processing
    invoked;
    QueMatches(matches) {
        this.matches = [...this.matches, ...matches];
        if (this.invoked)
            return;

        this.invoked = true;
        setTimeout(() => this.processMatches(), 1);
    }

    indexToContainerMap = new Map(); //containers by search index
    nodeToContainerMap = new Map(); //containers by the parent nodes of their head elements
    processMatches() {
        this.invoked = false;

        this.containerObserver = this.containerObserver || new ContainerObserver(this.nodeToContainerMap,
                () => GetNewMatchesEvent(this.getMatchCount()));
        this.nodeObserver = this.nodeObserver || new NodeObserver(this.nodeToContainerMap, this.indexToContainerMap,
            (container) => this.containerObserver.Observe(container));

        const timer = new PerformanceTimer();
        while (timer.Get() < processingTimeLimit && this.matches.length > 0) {
            const container = this.getContainer(this.matches.shift());
            this.nodeObserver.Observe(container.parentNode);
        }

        if (this.matches.length > 0 && !this.invoked) {
            this.invoked = true;
            setTimeout(() => this.processMatches(), processingTimeDelay);
        }
    }

    getContainer(match) {
        const parentNode = match.endNode.parentNode;
        let container = this.nodeToContainerMap.get(parentNode);
        if (!container) {
            container = new Container(parentNode, this.id);
            this.nodeToContainerMap.set(parentNode, container);
        }

        container.queMatch(match);
        return container;
    }

    //observes parents of nodes with matches, appends the visible ones and sends them to processing
    getNodeObserver(nodeMap, indexMap, passToProcessing) {
        const onObserve = (entries) => {
            
            entries.forEach((entry) => {
                const container = nodeMap.get(entry.target);
                observer.unobserve(entry.target);

                const elementVisible = entry.boundingClientRect.width > 2 && entry.boundingClientRect.height > 2;
                if (!elementVisible)
                    return;

                while (container.indexNextMatch(indexMap.size))
                    indexMap.set(indexMap.size, container);
                container.appendSelf();

                passToProcessing(container);
            });
        };

        var observer = new IntersectionObserver(onObserve);

        return observer;
    }
    //#endregion

    getMatchCount(includeUnprocessed = true) {
        return this.indexToContainerMap.size + (includeUnprocessed ? this.matches.length : 0);
    }

    getNewClosestMatch() {
        //TODO: reference old accent/screenposition
        return this.getMatchCount() > 0 ? 0 : null;
    }

    accentMatch(index) {
        if (index === this.accentedIndex)
            return;

        const lastAccentedContainer = this.indexToContainerMap.get(this.accentedIndex);
        if (lastAccentedContainer) {
            lastAccentedContainer.setAccent(this.accentedIndex, false);
            this.accentedIndex = null;
        }

        if (isNaN(index) || index < 0 || (this.indexToContainerMap.size + this.matches.length) == 0)
            return;

        if (!this.focusObserver)
            this.focusObserver = new IntersectionObserver(entries => {
                entries.forEach((entry) => {
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

    getFocusTargetAt(index) {
        if (index < this.indexToContainerMap.size) {
            this.accentedIndex = index;
            const accentedRectangles = this.indexToContainerMap.get(index)?.setAccent(index, true);
            return accentedRectangles?.length > 0 ? accentedRectangles[0] : null;
        }

        index -= this.indexToContainerMap.size;
        return this.matches[index]?.startNode?.parentNode;
    }

    clearSelection() {
        this.nodeObserver?.StopObserving();
        this.containerObserver?.StopObserving();
        ContainerObserver.QueForRemoval(Array.from(this.nodeToContainerMap.values()));

        this.matches = [];
        this.indexToContainerMap.clear();
        this.nodeToContainerMap.clear();
    }
}
//Time limits for recursive operations
const processingTimeLimit = 100;   
const processingTimeDelay = 5;

export default Highlighter;