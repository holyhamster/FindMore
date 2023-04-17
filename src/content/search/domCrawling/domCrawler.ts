import { SearchRegion } from './searchRegion';
import { PerformanceTimer } from '../performanceTimer';
import { FrameWalker } from './frameWalker';
import {
    ClosePanelListener, ClosePanelsEvent,
    NewIFrameEmitter,
    NewIFrameEvent
} from '../searchEvents';
import { Match } from './match';

//Goes recursively through SearchRegion, sends matches to Highlighter

export class DOMCrawler
    implements ClosePanelListener, NewIFrameEmitter {

    constructor(
        private eventElem: Element,
        private passMatches: (match: Match[]) => void) {

        this.eventElem.addEventListener(ClosePanelsEvent.type, () => {
            this.onClosePanel();
        });
    }

    private region: SearchRegion | undefined;
    private invoked = false;    //search is on setTimeout
    private interrupted = false;
    public Start(searchString: string, regex: RegExp) {
        this.interrupted = false;

        const frameWalker = new FrameWalker(document.body,
            (iframe: HTMLIFrameElement) => this.emitNewIFrame(iframe));
        this.region = new SearchRegion(searchString, regex, frameWalker);

        if (!this.invoked) {
            this.invoked = true;
            setTimeout(() => this.search(), DelayTime);
        }
    }

    private search(executionTime = 0) {
        let WALK_IN_PROGRESS;
        this.invoked = false;
        let callsLeft = consecutiveCalls;
        const measurer = new PerformanceTimer();

        while (!this.interrupted && callsLeft-- >= 0 &&
            (WALK_IN_PROGRESS = this.region!.TryExpand())) {
            const matches = this.region!.GetMatches();
            if (matches?.length > 0)
                this.passMatches(matches);
        }

        if (!WALK_IN_PROGRESS || this.interrupted)
            return;

        if ((executionTime += measurer.Get()) < recursionTimeLimit)
            this.search(executionTime)
        else {
            this.invoked = true;
            setTimeout(() => this.search(), DelayTime);
        }
    }

    onClosePanel() { this.interrupted = true; }

    emitNewIFrame(iframe: HTMLIFrameElement) {
        this.eventElem.dispatchEvent(new NewIFrameEvent(iframe))
    }
}

const consecutiveCalls = 200;       //Search region expand calls before checking for performance
const recursionTimeLimit = 100;     //Time limit to inject a delay
const DelayTime = 5;