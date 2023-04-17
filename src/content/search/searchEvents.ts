import { Options } from "../../options";

//collection of custom events that are fired on the root node of search panel

export interface IndexChangeListener { onIndexChange(index: number): void; }
export interface IndexChangeEmitter { emitIndexChange(index: number): void; }
export class IndexChangeEvent extends Event {
    static readonly type: string = "fm-index-change";
    constructor(public index: number) {
        super(IndexChangeEvent.type);
    }
}

export interface SearchRestartListener { onSearchRestart(): void; }
export interface SearchRestartEmitter { emitSearchRestart(): void; }
export class SearchRestartEvent extends Event {
    static readonly type: string = "fm-search-restart";
    constructor() {
        super(SearchRestartEvent.type);
    }
}

export interface NewIFrameListener { onNewIFrame(iFrame: HTMLIFrameElement): void };
export interface NewIFrameEmitter { emitNewIFrame(iFrame: HTMLIFrameElement): void };
export class NewIFrameEvent extends Event {
    static readonly type: string = "fm-new-iframe";
    constructor(public iframe: HTMLIFrameElement) {
        super(NewIFrameEvent.type);
    }
}

export interface ClosePanelListener { onClosePanel(): void };
export interface ClosePanelEmitter { emitClosePanel(): void };
export class ClosePanelsEvent extends Event {
    static readonly type: string = "fm-search-close";
    constructor(public id: number) {
        super(ClosePanelsEvent.type, { bubbles: true });
    }
}

export interface NewMatchesListener { onNewMatches(newCount: number, totalCount: number): void };
export interface NewMatchesEmitter { emitNewMatches(newCount: number, totalCount: number): void };
export class NewMatchesEvent extends Event {
    static readonly type: string = "fm-new-matches";
    constructor(public newCount: number, public totalCount: number) {
        super(NewMatchesEvent.type);
    }
}

export interface OptionsChangeListener { onOptionsChange(options: Options): void };
export interface OptionsChangeEmitter { emitOptionsChange(options: Options): void };
export class OptionsChangeEvent extends Event {
    static readonly type: string = "fm-options-change";
    constructor(public options: Options) {
        super(OptionsChangeEvent.type);
    }
}

export interface ColorChangeListener { onColorChange(index: number): void };
export interface ColorChangeEmitter { emitColorChange(index: number): void };
export class ColorChangeEvent extends Event {
    static readonly type: string = "fm-color-change";
    constructor(public index: number) {
        super(ColorChangeEvent.type);
    }
}

export interface AdvanceIndexListener { onAdvanceIndex(forward: boolean): void };
export interface AdvanceIndexEmitter { emitAdvanceIndex(forward: boolean): void };
export class AdvanceIndexEvent extends Event {
    static readonly type: string = "fm-index-advance";
    constructor(public forward: boolean) {
        super(AdvanceIndexEvent.type);
    }
}