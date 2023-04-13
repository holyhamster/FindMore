import { Container } from './container';
import { ContainerObserver } from './containerObserver';
import { ParentObserver } from './parentObserver';
import { ContainerRemoval } from './containerRemoval';
import { PerformanceTimer } from '../performanceTimer';
import { Match } from '../match';
import {
    NewMatchesEvent, NewMatchesEmitter,
    ClosePanelsEvent, ClosePanelListener,
    SearchRestartEvent, SearchRestartListener
} from '../searchEvents';

//Accepts matches and creates highlight containers
//Happens in four stages to optimize browser's reflow calls:
// - QueMatches() synchronously from DOMCrawler
// - ProcessMatches() recursively creates/finds a container for each match, makes a delay if execution is too long
// - ParentObserver asynchronously decides if the parent node of the match is visible, if yes appends the container
// - ContainerObserver asynchronously calculates all highlight rectangles, appends them to the container
export class ContainerCollection implements
    NewMatchesEmitter, SearchRestartListener, ClosePanelListener {

    indexToContainer = new Map<number, Container>();
    parentToContainer = new Map<Element, Container>();
    containerObserver: ContainerObserver;
    parentObserver: ParentObserver;

    constructor(
        private id: number,
        private eventElement: Element) {

        this.containerObserver = new ContainerObserver(this.parentToContainer);

        const processContainer = (container: Container) => this.containerObserver.Observe(container);
        const onNewMatches = (newMatches: number, totalMatches: number) => {
            ContainerRemoval.Trigger();
            this.emitNewMatches(newMatches, totalMatches);
        }

        this.parentObserver = new ParentObserver(this.parentToContainer, this.indexToContainer,
            processContainer, onNewMatches);

        eventElement.addEventListener(SearchRestartEvent.type, () => this.onSearchRestart());
        eventElement.addEventListener(ClosePanelsEvent.type, () => this.onClosePanel());
    }
    
    onClosePanel() { this.clear(); }

    onSearchRestart() { this.clear(); }

    emitNewMatches(newCount: number, totalCount: number) {
        this.eventElement.dispatchEvent(new NewMatchesEvent(newCount, totalCount));
    }

    matches: Match[] = [];       //que of DOMCrawler matches for processing
    invoked = false;
    QueMatches(matches: Match[]) {
        this.matches = [...this.matches, ...matches];
        if (this.invoked)
            return;

        this.invoked = true;
        setTimeout(() => this.processMatches(), 1);
    }


    private processMatches() {
        this.invoked = false;
        const timer = new PerformanceTimer();
        while (timer.IsUnder(processingMSLimit) && this.matches.length > 0) {
            const container = this.getContainer(this.matches.shift()!);
            if (!container)
                continue;
            this.parentObserver.Observe(container.parentElement);
        }

        if (this.matches.length > 0 && !this.invoked) {
            this.invoked = true;
            setTimeout(() => this.processMatches(), processingMSDelay);
        }
    }

    private getContainer(match: Match): Container | null {
        const safeElement = Container.GetSafeElement(match);
        if (!safeElement)
            return null;
        const parent = safeElement.parentElement;
        let container = this.parentToContainer.get(parent);
        if (!container) {
            container = new Container(safeElement, this.id);
            this.parentToContainer.set(parent, container);
        }

        container.QueMatch(match);
        return container;
    }

    private clear() {
        this.parentObserver?.StopObserving();
        this.containerObserver?.StopObserving();
        ContainerRemoval.Que(Array.from(this.parentToContainer.values()));

        this.matches = [];
        this.indexToContainer.clear();
        this.parentToContainer.clear();
    }
}

//observer that scrolls towards if the element is outside viewpoint

const processingMSLimit = 100;
const processingMSDelay = 5;