import { GetPersonalHighlightCSS, SharedHighlightCSS } from './cssInjection'
import { ClosePanelsEvent } from '../search'
import { ColorChangeEvent } from '../panel'
import { NewIFrameEvent } from '../domCrawling/searchRegion'
import { OptionsChangeEvent } from '../rootNode'

//Adds and edits css elements for highlight rectangles by:
//-adding an adopted sheet to the main document
//-watching for iframe discover events and adding <style> to it
//-if style changes, reapplying it to both adopted sheet and all previously discovered iframes
//for performance css is split in two: part that's shared between all searches and personal color settings

export class Styler {
    iframes: Document[] = [];
    constructor(
        private id: number,
        private eventElemenet: Element,
        private colorIndex: number,
        private highlightAlpha: string) {
        this.addEvents(this.eventElemenet);
        this.updateStyle();
    }
    addEvents(eventElement: Element) {
        eventElement.addEventListener(ClosePanelsEvent.type,
            () => this.clearStyles());

        eventElement.addEventListener(OptionsChangeEvent.type,
            (args: any) => {
                if (args?.options?.HighlightOpacity) {
                    this.highlightAlpha = args.options.HighlightOpacity;
                    this.updateStyle();
                }
            });

        eventElement.addEventListener(NewIFrameEvent.type,
            (args: any) => {
                const newIFrame = args?.iframe?.contentDocument as Document;
                if (!newIFrame)
                    return;
                const f = HTMLIFrameElement;
                
                if (!this.iframes.includes(newIFrame))
                    this.iframes.push(newIFrame);

                this.updateIframe(newIFrame);
            });

        eventElement.addEventListener(ColorChangeEvent.type,
            (args: any) => {
                if (args?.colorIndex) {
                    this.colorIndex = args.colorIndex;
                    this.updateStyle();
                }
            });
    }

    updateStyle() {
        this.updateAdoptedSheet();
        this.iframes.forEach((iframe) => this.updateIframe(iframe));
    }

    personalSheet: CSSStyleSheet | undefined;
    static sharedSheet: CSSStyleSheet | undefined;
    updateAdoptedSheet() {
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

    removeAdoptedStyle() {
        const personalSheetIndex = Array.from(document.adoptedStyleSheets)
            .findIndex((style) => style === this.personalSheet);
        if (isNaN(personalSheetIndex))
            return;

        const currentAdoptedArray = Array.from(document.adoptedStyleSheets);
        currentAdoptedArray.splice(personalSheetIndex, 1);
        document.adoptedStyleSheets = currentAdoptedArray;
        this.personalSheet = undefined;
    }

    updateIframe(iframe: Document) {
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

    removeIframeStyles() {
        this.iframes.forEach((iframe) => {
            iframe.getElementsByClassName(`fm-iframe${this.id}`)[0]?.remove();
        });
        this.iframes = [];
    }

    clearStyles() {
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
