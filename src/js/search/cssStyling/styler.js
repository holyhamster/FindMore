import { GetPersonalHighlightCSS, SharedHighlightCSS } from './cssInjection.js'
import { GetClosePanelsEvent } from '../search.js'
import { GetColorchangeEvent } from '../panel.js'
import { GetNewIframeEvent } from '../domCrawling/searchRegion.js'
import { GetOptionsChangeEvent } from '../rootNode.js'

//Adds and edits css elements for highlight rectangles by:
//-adding an adopted sheet to the main document
//-watching for iframe discover events and adding <style> to it
//-if style changes, reapplying it to both adopted sheet and all previously discovered iframes
//for performance css is split in two: part that's shared between all searches and personal color settings

export class Styler {
    constructor(id, eventElemenet, colorIndex, highlightAlpha) {
        this.id = id;
        this.eventElement = eventElemenet;
        this.colorIndex = colorIndex;
        this.highlightAlpha = highlightAlpha;
        this.addEvents(eventElemenet);
        this.updateStyle();
    }
    addEvents(eventElement) {
        eventElement.addEventListener(GetClosePanelsEvent().type,
            () => this.clearStyles());

        eventElement.addEventListener(GetOptionsChangeEvent().type,
            (args) => {
                if (args?.options.HighlightOpacity) {
                    this.highlightAlpha = args.options.HighlightOpacity;
                    this.updateStyle();
                }
            });

        eventElement.addEventListener(GetNewIframeEvent().type,
            (args) => {
                const newIFrame = args.iframe.contentDocument;
                if (!newIFrame)
                    return;
                
                if (!this.iframes.includes(newIFrame))
                    this.iframes.push(newIFrame);

                this.updateIframe(newIFrame);
            });

        eventElement.addEventListener(GetColorchangeEvent().type,
            (args) => {
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

    personalSheet;
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
        this.personalSheet = null;
    }

    iframes = [];
    updateIframe(iframe) {
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
function addStyleToIFrame(iframe, styleclass, styletext) {
    const style = iframe.createElement(`style`);
    style.setAttribute("class", styleclass);
    style.innerHTML = styletext;
    iframe.head.appendChild(style);
}

export function GetStyleChangeEvent(args) {
    const event = new Event("fm-style-change");
    Object.assign(event, args);
    return event;
}