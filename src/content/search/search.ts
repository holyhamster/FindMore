import { DOMCrawler } from './domCrawling/domCrawler';
import { ContainerCollection } from './rendering/containerCollection';
import { Panel } from './panel';
import { State } from './state';
import { RootNode } from './rootNode';
import { Match } from './match';
import { Styler } from './cssStyling/styler';
import { Indexer } from './rendering/indexer';
import {
    ClosePanelsEvent, ClosePanelEmitter,
    SearchRestartEvent, SearchRestartEmitter, SearchRestartListener, OptionsChangeEvent
} from './searchEvents';
//Nexus class for UI Panel, DOMCrawler and Highlighter:
//Panel holds and controls UI for the search, top element is used to dispatch events
//DOMCrawler goes through DOM tree of the document and sends all matches to Highlighter
//Highlighter takes matches and creates html elements around them

export class Search implements
    ClosePanelEmitter, SearchRestartEmitter, SearchRestartListener {

    public panel: Panel;
    private crawler: DOMCrawler;
    private highlighter: ContainerCollection;

    constructor(
        public id: number,
        public state: State,
        options: any = undefined) {

        this.panel = new Panel(id, state);
        const eventRoot = this.panel.GetEventRoot();

        const styler = new Styler(id, eventRoot, state.colorIndex, options?.highlightAlpha);

        this.highlighter = new ContainerCollection(this.id, eventRoot);

        const indexer = new Indexer(this.highlighter.indexToContainer, eventRoot, !state.pinned);

        this.crawler = new DOMCrawler(this.panel.GetEventRoot(),
            (matches: Match[]) => this.highlighter.QueMatches(matches));

        eventRoot.addEventListener(SearchRestartEvent.type, () => this.onSearchRestart());

        this.start();
    }

    emitClosePanel() { this.panel.GetEventRoot().dispatchEvent(new ClosePanelsEvent(this.id)); }

    emitSearchRestart() {
        this.panel.GetEventRoot().dispatchEvent(new SearchRestartEvent());
    }

    onSearchRestart() { this.start(); }

    start() {
        if (this.state.IsEmpty())
            return;
        this.crawler.Start(this.state.searchString, this.state.GetRegex(true));
    }

    Close() {
        this.emitClosePanel();
    }

    Restart() {
        this.emitSearchRestart();
    }

    public static Options: any; //,move to options
    static SetOptions(options: any) {
        Search.Options = options;
        RootNode.Get().dispatchEvent(new OptionsChangeEvent(options));
    }

    static NextFocus() {
        Panel.NextFocus();
    }
}

Search.Options = undefined;