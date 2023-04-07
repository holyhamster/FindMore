import { Container } from './container';
import { ContainerObserver } from './containerObserver';
import { ParentObserver } from './parentObserver';
import { ContainerRemoval } from './containerRemoval';
import { PerformanceTimer } from '../performanceTimer';
import { NewMatchesEvent } from '../search';
import { Match } from '../match';

//Accepts matches and creates highlight elements for them
//Happens in four stages to optimize browser's reflow calls:
// - QueMatches() synchronously from DOMCrawler
// - ProcessMatches() recursively creates/finds a container for each match, makes a delay if execution is too long
// - NodeObserver asynchronously decides if the parent node of the match is visible, if yes appends the container
// - ContainerObserver asynchronously calculates all highlight rectangles, appends them to the container
export class Highlighter {
    constructor(private id: number, private eventElement: Element) {
    }

    //#region RECURSIVE HIGHLIGHT 
    matches: Match[] = [];       //que of DOMCrawler matches for processing
    invoked = false;
    QueMatches(matches: Match[]) {
        this.matches = [...this.matches, ...matches];
        if (this.invoked)
            return;

        this.invoked = true;
        setTimeout(() => this.processMatches(), 1);
    }

    indexToContainer = new Map<number, Container>();
    parentToContainer = new Map<Element, Container>();
    containerObserver: ContainerObserver | undefined;
    parentObserver: ParentObserver | undefined;
    processMatches() {
        this.invoked = false;

        this.containerObserver = this.containerObserver || new ContainerObserver(this.parentToContainer,
            () => this.eventElement.dispatchEvent(new NewMatchesEvent(this.GetMatchcount())));
        this.parentObserver = this.parentObserver || new ParentObserver(this.parentToContainer, this.indexToContainer,
            (container: Container) => this.containerObserver!.Observe(container));

        const timer = new PerformanceTimer();
        while (timer.IsUnder(processingMSLimit) && this.matches.length > 0) {
            const container = this.getContainer(this.matches.shift()!);
            this.parentObserver.Observe(container);
        }

        if (this.matches.length > 0 && !this.invoked) {
            this.invoked = true;
            setTimeout(() => this.processMatches(), processingMSDelay);
        }
    }

    getContainer(match: Match): Container {
        const parentNode = match.parent;
        let container = this.parentToContainer.get(parentNode);
        if (!container) {
            container = new Container(parentNode, match.target, this.id);
            this.parentToContainer.set(parentNode, container);
        }

        container.QueMatch(match);
        return container;
    }

    accentedIndex: number | undefined;
    scrollObserver: IntersectionObserver | undefined;
    AccentMatch(index: number, scrollTowards: boolean) {
        if (index === this.accentedIndex)
            return;

        if (this.accentedIndex) {
            const oldAccentContainer = this.indexToContainer.get(this.accentedIndex);
            if (oldAccentContainer) {
                oldAccentContainer.SetAccent(this.accentedIndex, false);
                this.accentedIndex = undefined;
            }
        }

        if (isNaN(index) || index < 0 || this.GetMatchcount() == 0)
            return;

        const accentTarget = this.getAccentTarget(index);
        this.accentedIndex = accentTarget?.processed ? index : undefined;

        this.scrollObserver = this.scrollObserver || getScrollObserver();
        if (scrollTowards && accentTarget?.element)
            this.scrollObserver.observe(accentTarget.element as Element);
    }

    //returns an element that should be highlighted and scrolled towards from the given match index
    getAccentTarget(index: number) {
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
                element: this.matches[index - this.indexToContainer.size]?.parent
            }
    }

    GetMatchcount(includeUnprocessed = true) {
        return this.indexToContainer.size + (includeUnprocessed ? this.matches.length : 0);
    }

    //returns index of the match closest to accent of the previous search. 
    //0 if there's no previous accent
    //null if there's no matches
    GetNewIndex(): number | undefined {
        if (this.GetMatchcount() == 0)
            return;
        if (!this.prevSearchAccent || this.parentToContainer?.has(this.prevSearchAccent.parent))
            return 0;

        const pastMatches =
            this.parentToContainer.get(this.prevSearchAccent.parent)!.GetAllMatches();
        const matchIndex = Match.FindIndexOfClosest(
            pastMatches, this.prevSearchAccent.match);

        return matchIndex ? pastMatches[matchIndex].index : undefined;
    }

    prevSearchAccent: { match: Match, parent: Element } | undefined
    Clear() {
        if (this.accentedIndex && this.accentedIndex > 0)
            this.prevSearchAccent = this.getAccentData(this.accentedIndex);

        this.accentedIndex = undefined;
        this.parentObserver?.StopObserving();
        this.containerObserver?.StopObserving();
        ContainerRemoval.Que(Array.from(this.parentToContainer.values()));

        this.matches = [];
        this.indexToContainer.clear();
        this.parentToContainer.clear();
    }

    getAccentData(index: number) {
        const container = this.indexToContainer.get(index);
        const match = container?.GetMatch(index);
        if (container && match)
            return { match: match, parent: container.parentNode as Element }
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