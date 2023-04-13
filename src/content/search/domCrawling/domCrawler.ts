import { SearchRegion } from './searchRegion';
import { PerformanceTimer } from '../performanceTimer';
import { Match } from '../match';
import { FrameWalker } from './frameWalker';
import { Interruptable } from '../interruptable';
import {
    ClosePanelListener, ClosePanelsEvent,
    NewIFrameEmitter,
    NewIFrameEvent,
    SearchRestartEvent, SearchRestartListener
} from '../searchEvents';

//Goes recursively through SearchRegion, sends matches to Highlighter

export class DOMCrawler
    implements Interruptable, SearchRestartListener, ClosePanelListener, NewIFrameEmitter {

    constructor(
        private eventElem: Element,
        private passMatches: (match: Match[]) => void) {

        this.eventElem.addEventListener(SearchRestartEvent.type, () => {
            this.Interrupt();
        });

        this.eventElem.addEventListener(ClosePanelsEvent.type, () => {
            this.onClosePanel();
        });
    }

    private region: SearchRegion | undefined;
    public Start(searchString: string, regex: RegExp) {
        this.interrupted = false;

        const frameWalker = new FrameWalker(document.body,
            (iframe: HTMLIFrameElement) => this.emitNewIFrame(iframe));
        this.region = new SearchRegion(searchString, regex, frameWalker);

        setTimeout(() => this.search(this.region!, this.passMatches), 1);
    }

    private interrupted = false;
    public Interrupt() {
        this.interrupted = true;
        this.region = undefined;
    }

    private search(
        searchRegion: SearchRegion,
        passMatches: (match: Match[]) => void,
        executionTime = 0) {

        let WALK_IN_PROGRESS, callsLeft = consecutiveCalls;
        const measurer = new PerformanceTimer();

        while (!this.interrupted && (callsLeft -= 1) >= 0 &&
            (WALK_IN_PROGRESS = searchRegion.TryExpand())) {
            const matches = searchRegion.GetMatches();
            if (matches?.length > 0)
                passMatches(matches);
        }

        if (!WALK_IN_PROGRESS)
            return;

        if ((executionTime += measurer.Get()) < recursionTimeLimit)
            this.search(searchRegion, passMatches, executionTime)
        else
            setTimeout(() => this.search(searchRegion, passMatches), DelayTime);
    }

    onClosePanel() { this.Interrupt(); }

    onSearchRestart() { this.Interrupt(); }

    emitNewIFrame(iframe: HTMLIFrameElement) {
        this.eventElem.dispatchEvent(new NewIFrameEvent(iframe))
    }
}

const consecutiveCalls = 200;       //Search region expand calls before checking for performance
const recursionTimeLimit = 100;     //Time limit to inject a delay
const DelayTime = 5;