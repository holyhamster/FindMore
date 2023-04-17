import { DOMCrawler } from './domCrawling/domCrawler';
import { Panel } from './panel';
import { State } from './state';
import { Styler } from './cssStyling/styler';
import { Indexer } from './rendering/indexer';
import { Observer } from './rendering/observer';
import { Match } from './domCrawling/match';
import {
    ClosePanelsEvent, ClosePanelEmitter,
    SearchRestartEvent, SearchRestartEmitter, SearchRestartListener, OptionsChangeEvent
} from './searchEvents';
//Nexus class for UI Panel, DOMCrawler, ContainerCollection, Indexer and Styler
//Data flows between them via events located in SearchEvents
export class Search implements
    ClosePanelEmitter, SearchRestartEmitter, SearchRestartListener {

    public panel: Panel;
    private crawler: DOMCrawler;

    constructor(
        public id: number,
        public state: State,
        options: any = undefined) {

        this.panel = new Panel(id, state);
        const eventRoot = this.panel.GetEventRoot();

        const styler = new Styler(id, eventRoot, state.colorIndex, options?.highlightAlpha);

        const observer = new Observer(eventRoot, this.id);

        const scrollToFirstMatch = state.IsEmpty();
        const indexer = new Indexer(eventRoot, observer.IndexMap, scrollToFirstMatch);

        this.crawler = new DOMCrawler(eventRoot,
            (matches: Match[]) => observer.Que(matches));

        eventRoot.addEventListener(SearchRestartEvent.type, () => this.onSearchRestart());

        this.start();
    }

    emitClosePanel() { this.panel.GetEventRoot().dispatchEvent(new ClosePanelsEvent(this.id)); }

    emitSearchRestart() {
        this.panel.GetEventRoot().dispatchEvent(new SearchRestartEvent());
    }

    onSearchRestart() { this.start(); }

    private start() {
        if (this.state.IsEmpty())
            return;
        this.crawler.Start(this.state.searchString, this.state.GetRegex(true));
    }

    public Close() {
        this.emitClosePanel();
    }

    public Restart() {
        this.emitSearchRestart();
    }

    static NextFocus() {
        Panel.NextFocus();
    }
}