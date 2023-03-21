import Container from './rendering/container.js';
import { Match } from './match.js';
import { ContainerObserver } from './rendering/containerObserver.js';
import { ParentObserver } from './rendering/parentObserver.js';
import { PerformanceTimer } from './performanceTimer.js';
import { GetNewMatchesEvent } from '../search.js';
import { ContainerRemoval } from './rendering/containerRemoval.js';

//accepts matches and creates highlight elements for them
//Happens in four stages to optimize browser's reflow calls:
// - queMatches() synchronously from DOMSearcher
// - processMatches() recursively creates/finds a container for each match, makes a delay if execution is too long
// - NodeObserver asynchronously decides if the parent node of the match is visible, appends the container
// - ContainerObserver asynchronously calculates all highlight rectangles, appends them to the container
export class Highlighter {
    constructor(id, eventElement) {
        this.id = id;
        this.eventElement = eventElement;
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
    parentToContainerMap = new Map(); //containers by the parent nodes of their head elements
    processMatches() {
        this.invoked = false;

        this.containerObserver = this.containerObserver || new ContainerObserver(this.parentToContainerMap,
            () => this.eventElement.dispatchEvent(GetNewMatchesEvent(this.getMatchCount())) );
        this.parentObserver = this.parentObserver || new ParentObserver(this.parentToContainerMap, this.indexToContainerMap,
            (container) => this.containerObserver.Observe(container));

        const timer = new PerformanceTimer();
        while (timer.Get() < processingMSLimit && this.matches.length > 0) {
            const container = this.containerize(this.matches.shift());
            this.parentObserver.Observe(container);
        }

        if (this.matches.length > 0 && !this.invoked) {
            this.invoked = true;
            setTimeout(() => this.processMatches(), processingMSDelay);
        }
    }

    containerize(match) {
        const parentNode = match.endNode.parentNode;
        let container = this.parentToContainerMap.get(parentNode);
        if (!container) {
            container = new Container(parentNode, this.id);
            this.parentToContainerMap.set(parentNode, container);
        }

        container.QueMatch(match);
        return container;
    }

    getMatchCount(includeUnprocessed = true) {
        return this.indexToContainerMap.size + (includeUnprocessed ? this.matches.length : 0);
    }

    getNewClosestMatch() {
        if (this.getMatchCount() == 0)
            return;
        if (!this.lastAccent)
            return 0;
        const closest = findClosestMatch(this.lastAccent, this.parentToContainerMap);
        return findClosestMatch(this.lastAccent, this.parentToContainerMap);
    }

    accentMatch(index, scrollTowards) {
        if (index === this.accentedIndex)
            return;

        const lastAccentedContainer = this.indexToContainerMap.get(this.accentedIndex);
        if (lastAccentedContainer) {
            lastAccentedContainer.SetAccent(this.accentedIndex, false);
            this.accentedIndex = null;
        }

        if (isNaN(index) || index < 0 || this.getMatchCount() == 0)
            return;

        this.focusObserver = this.focusObserver || new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    this.focusObserver.unobserve(entry.target);
                    if (!entry.isIntersecting)
                        entry.target.scrollIntoView({ block: "center" });
                });
            });

        let focusTarget;
        if (index < this.indexToContainerMap.size) {
            this.accentedIndex = index;
            console.log(index);
            const accentedRectangles = this.indexToContainerMap.get(index)?.SetAccent(index, true);
            focusTarget = accentedRectangles?.length > 0 ? accentedRectangles[0] : null;
        }
        else
            focusTarget = this.matches[index - this.indexToContainerMap.size]?.endNode?.parentNode;

        if (scrollTowards && focusTarget)
            this.focusObserver.observe(focusTarget);
    }

    clearSelection() {
        if (this.accentedIndex > 0)
            this.lastAccent = this.getAccentData(this.accentedIndex);

        this.accentedIndex = null;
        this.parentObserver?.StopObserving();
        this.containerObserver?.StopObserving();
        ContainerRemoval.Que(Array.from(this.parentToContainerMap.values()));

        
        
        this.matches = [];
        this.indexToContainerMap.clear();
        this.parentToContainerMap.clear();
    }
    getAccentData(index) {
        
        const container = this.indexToContainerMap.get(index);
        const match = container?.GetIndexedMatch(index);
        if (container && match) 
            return { match: match, parent: container.parentNode }
            
    }
}


function findClosestMatch(lastAccent, parentToContainerMap) {
    const container = parentToContainerMap?.get(lastAccent?.parent);
    if (container)
    {
        const match = Match.FindClosestAmong(lastAccent.match, container.GetIndexedMatches());
        return match?.index;
    }
    return 0;
}

const processingMSLimit = 100;   
const processingMSDelay = 5;