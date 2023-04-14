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
//Nexus class for UI Panel, DOMCrawler, ContainerCollection, Indexer and Styler

export class Search implements
    ClosePanelEmitter, SearchRestartEmitter, SearchRestartListener {

    public panel: Panel;
    private crawler: DOMCrawler;
    private containers: ContainerCollection;

    constructor(
        public id: number,
        public state: State,
        options: any = undefined) {

        this.panel = new Panel(id, state);
        const eventRoot = this.panel.GetEventRoot();

        const styler = new Styler(id, eventRoot, state.colorIndex, options?.highlightAlpha);

        this.containers = new ContainerCollection(eventRoot, this.id);

        const indexer = new Indexer(eventRoot, this.containers.indexToContainer,
            !state.pinned);

        this.crawler = new DOMCrawler(eventRoot,
            (matches: Match[]) => this.containers.QueMatches(matches));

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