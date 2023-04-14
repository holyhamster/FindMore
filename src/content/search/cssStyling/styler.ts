import { GetPersonalHighlightCSS, SharedHighlightCSS } from './cssInjection'
import { Options } from '../../../options'
import { ClosePanelsEvent, ClosePanelListener, NewIFrameEvent, NewIFrameListener, OptionsChangeEvent, ColorChangeEvent, OptionsChangeListener, ColorChangeListener } from '../searchEvents';

//Adds and edits css elements for highlight rectangles by:
//-adding an adopted sheet to the main document
//-watching for iframe discover events and adding <style> to it
//-if style changes, reapplying it to both adopted sheet and all previously discovered iframes
//for performance css is split in two: part that's shared between all searches and personal color settings

export class Styler implements
    ClosePanelListener, NewIFrameListener, OptionsChangeListener, ColorChangeListener {

    iframes: Document[] = [];
    constructor(
        private id: number,
        eventElement: Element,
        private colorIndex: number,
        private highlightAlpha: number) {

        eventElement.addEventListener(ClosePanelsEvent.type, () => this.onClosePanel());

        eventElement.addEventListener(OptionsChangeEvent.type,
            (args: any) => this.onOptionsChange(args.options));

        eventElement.addEventListener(NewIFrameEvent.type,
            (args: any) => this.onNewIFrame(args.iframe));

        eventElement.addEventListener(ColorChangeEvent.type,
            (args: any) => this.onColorChange(args.index));
        this.updateStyle();
    }

    onClosePanel() { this.clear(); }

    onNewIFrame(IFrame: HTMLIFrameElement) {
        const iDoc = IFrame?.contentDocument;
        if (!iDoc)
            return;
        const f = HTMLIFrameElement;

        if (!this.iframes.includes(iDoc))
            this.iframes.push(iDoc);

        this.updateIframe(iDoc);
    }

    onOptionsChange(options: Options) {
        this.highlightAlpha = options.HighlightOpacity;
        this.updateStyle();
    }
    onColorChange(index: number) {
        this.colorIndex = index;
        this.updateStyle()
    }
    private updateStyle() {
        this.updateAdoptedSheet();
        this.iframes.forEach((iframe) => this.updateIframe(iframe));
    }

    personalSheet: CSSStyleSheet | undefined;
    static sharedSheet: CSSStyleSheet | undefined;
    private updateAdoptedSheet() {
        if (!Styler.sharedSheet) {
            Styler.sharedSheet = new CSSStyleSheet();
            Styler.sharedSheet.replaceSync(SharedHighlightCSS);
            document.adoptedStyleSheets = [...document.adoptedStyleSheets, Styler.sharedSheet];
        }

        if (!this.personalSheet)
            this.personalSheet = new CSSStyleSheet();
        if (!document.adoptedStyleSheets.includes(this.personalSheet))
            document.adoptedStyleSheets = [...document.adoptedStyleSheets, this.personalSheet];

        this.personalSheet.replaceSync(GetPersonalHighlightCSS(this.id, this.colorIndex, this.highlightAlpha));
    }

    private removeAdoptedStyle() {
        const personalSheetIndex = Array.from(document.adoptedStyleSheets)
            .findIndex((style) => style === this.personalSheet);
        if (isNaN(personalSheetIndex))
            return;

        const currentAdoptedArray = Array.from(document.adoptedStyleSheets);
        currentAdoptedArray.splice(personalSheetIndex, 1);
        document.adoptedStyleSheets = currentAdoptedArray;
        this.personalSheet = undefined;
    }

    private updateIframe(iframe: Document) {
        const sharedStyleClass = `fm-iframeDefStyle`;
        let existingSharedStyle = iframe.getElementsByClassName(sharedStyleClass)[0];
        if (!existingSharedStyle) {
            addStyleToIFrame(iframe, sharedStyleClass, SharedHighlightCSS);
        }

        const personalStyleClass = `fm-iframe${this.id}`;
        const existingPersonalStyle = iframe.getElementsByClassName(personalStyleClass)[0];
        const personalCSS = GetPersonalHighlightCSS(this.id, this.colorIndex, this.highlightAlpha);
        if (existingPersonalStyle)
            existingPersonalStyle.innerHTML = personalCSS;
        else
            addStyleToIFrame(iframe, personalStyleClass, GetPersonalHighlightCSS(this.id, this.colorIndex, this.highlightAlpha));
    }

    private removeIframeStyles() {
        this.iframes.forEach((iframe) => {
            iframe.getElementsByClassName(`fm-iframe${this.id}`)[0]?.remove();
        });
        this.iframes = [];
    }

    private clear() {
        this.removeAdoptedStyle();
        this.removeIframeStyles();
    }
}
function addStyleToIFrame(iframe: Document, styleclass: string, styletext: string) {
    const style = iframe.createElement(`style`);
    style.setAttribute("class", styleclass);
    style.innerHTML = styletext;
    iframe.head.appendChild(style);
}


export class StyleChangeEvent extends Event {
    static readonly type: string = "fm-style-change";
    constructor(args: any) {
        super(StyleChangeEvent.type);
        Object.assign(this, args);
    }
}
