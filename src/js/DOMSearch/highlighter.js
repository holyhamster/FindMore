import Container from './rendering/container.js';
import { Match } from './match.js';
import { ContainerObserver } from './rendering/containerObserver.js';
import { ParentObserver } from './rendering/parentObserver.js';
import { PerformanceTimer } from './performanceTimer.js';
import { GetNewMatchesEvent } from '../search.js';
import { ContainerRemoval } from './rendering/containerRemoval.js';

//Accepts matches and creates highlight elements for them
//Happens in four stages to optimize browser's reflow calls:
// - QueMatches() synchronously from DOMSearcher
// - ProcessMatches() recursively creates/finds a container for each match, makes a delay if execution is too long
// - NodeObserver asynchronously decides if the parent node of the match is visible, if yes appends the container
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

    indexToContainer = new Map();
    parentToContainer = new Map();
    processMatches() {
        this.invoked = false;

        this.containerObserver = this.containerObserver || new ContainerObserver(this.parentToContainer,
            () => this.eventElement.dispatchEvent(GetNewMatchesEvent(this.GetMatchcount())));
        this.parentObserver = this.parentObserver || new ParentObserver(this.parentToContainer, this.indexToContainer,
            (container) => this.containerObserver.Observe(container));

        const timer = new PerformanceTimer();
        while (timer.Get() < processingMSLimit && this.matches.length > 0) {
            const container = this.getContainer(this.matches.shift());
            this.parentObserver.Observe(container);
        }

        if (this.matches.length > 0 && !this.invoked) {
            this.invoked = true;
            setTimeout(() => this.processMatches(), processingMSDelay);
        }
    }

    getContainer(match) {
        const parentNode = match.parentNode;
        let container = this.parentToContainer.get(parentNode);
        if (!container) {
            container = new Container(parentNode, this.id);
            this.parentToContainer.set(parentNode, container);
        }

        container.QueMatch(match);
        return container;
    }

    AccentMatch(index, scrollTowards) {
        if (index === this.accentedIndex)
            return;

        const oldAccentContainer = this.indexToContainer.get(this.accentedIndex);
        if (oldAccentContainer) {
            oldAccentContainer.SetAccent(this.accentedIndex, false);
            this.accentedIndex = null;
        }

        if (isNaN(index) || index < 0 || this.GetMatchcount() == 0)
            return;

        const accentTarget = this.getAccentTarget(index);
        this.accentedIndex = accentTarget.processed ? index : null;

        this.scrollObserver = this.scrollObserver || getScrollObserver();
        if (scrollTowards && accentTarget.element)
            this.scrollObserver.observe(accentTarget.element);
    }

    //returns an element that should be highlighted and scrolled towards from the given match index
    getAccentTarget(index) {
        const TARGET_HAS_BEEN_PROCESSED = index < this.indexToContainer.size;
        if (TARGET_HAS_BEEN_PROCESSED) {
            this.accentedIndex = index;
            const accentedRectangles = this.indexToContainer.get(index)?.SetAccent(index, true);
            return {
                processed: true,
                index: index,
                element: accentedRectangles?.[0]
            }
        }
        const TARGET_IN_PROCESSING = index - this.indexToContainer.size < this.matches.length;
        if (TARGET_IN_PROCESSING)
            return {
                processed: false,
                element: this.matches[index - this.indexToContainer.size]?.parentNode
            }
    }

    GetMatchcount(includeUnprocessed = true) {
        return this.indexToContainer.size + (includeUnprocessed ? this.matches.length : 0);
    }

    //returns index of the match closest to accent of the previous search. 
    //0 if there's no previous accent
    //null if there's no matches
    GetNewIndex() {
        if (this.GetMatchcount() == 0)
            return;

        const containerOfPreviousAccent = this.parentToContainer?.get(this.prevSearchAccent?.parent);
        if (containerOfPreviousAccent) {
            const match = Match.FindClosestAmong(containerOfPreviousAccent.GetAllMatches(), this.prevSearchAccent.match);
            return match?.index;
        }
        

        return 0;
    }

    Clear() {
        if (this.accentedIndex > 0)
            this.prevSearchAccent = this.getAccentData(this.accentedIndex);

        this.accentedIndex = null;
        this.parentObserver?.StopObserving();
        this.containerObserver?.StopObserving();
        ContainerRemoval.Que(Array.from(this.parentToContainer.values()));

        this.matches = [];
        this.indexToContainer.clear();
        this.parentToContainer.clear();
    }

    getAccentData(index) {
        const container = this.indexToContainer.get(index);
        const match = container?.GetMatch(index);
        if (container && match)
            return { match: match, parent: container.parentNode }
    }
}

//observer that scrolls towards if the element is outside viewpoint
function getScrollObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            observer.unobserve(entry.target);
            if (!entry.isIntersecting)
                entry.target.scrollIntoView({ block: "center" });
        });
    });
    return observer;
}

const processingMSLimit = 100;
const processingMSDelay = 5;