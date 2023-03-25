import { GetPersonalHighlightCSS, SharedHighlightCSS } from './cssInjection.js'
import { GetClosePanelsEvent } from '../search.js'
import { GetColorchangeEvent } from '../panel.js'
import { GetNewIframeEvent } from '../domCrawling/searchRegion.js'
import { GetOptionsChangeEvent } from '../root.js'

//Adds and edits css elements for highlight rectangles by:
//-adding an adopted sheet to the main document
//-watching for iframe discover events and adding <style> to it
//-if style changes, reapplying it to both adopted sheet and all previously discovered iframes
//for performance css is split in two: part that's shared between all searches and personal color settings

export class Styler {
    constructor(id, parentElement, colorIndex, highlightAlpha = .8) {
        this.id = id;
        this.parentElement = parentElement;
        this.colorIndex = colorIndex;
        this.highlightAlpha = highlightAlpha;

        parentElement.addEventListener(GetClosePanelsEvent().type,
            () => this.clearStyles());

        parentElement.addEventListener(GetOptionsChangeEvent().type,
            (args) => {
                if (args?.options.highlightAlpha) {
                    this.highlightAlpha = args.options.highlightAlpha;
                    this.updateStyle();
                }
            });
        
        parentElement.addEventListener(GetNewIframeEvent().type,
            (args) => this.onIframeDiscover(args?.iframe?.contentDocument));

        parentElement.addEventListener(GetColorchangeEvent().type,
            (args) => {
                if (args?.colorIndex) {
                    this.colorIndex = args.colorIndex;
                    this.updateStyle();
                }
            });

        this.updateStyle();
    }

    updateStyle() {
        this.updateAdoptedSheet();
        this.updateIframeStyle();
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
            .findIndex((style) => style === this.personalSheet );
        if (isNaN(personalSheetIndex))
            return;

        const currentAdoptedArray = Array.from(document.adoptedStyleSheets);
        currentAdoptedArray.splice(personalSheetIndex, 1);
        document.adoptedStyleSheets = currentAdoptedArray;
        this.personalSheet = null;
    }

    iframes = [];
    updateIframeStyle() {
        const styleClass = `fm-iframe${this.id}`;
        this.iframes.forEach((iframe) => {
            const existingStyle = iframe.getElementsByClassName(styleClass)[0];
            const cssString = GetPersonalHighlightCSS(this.id, this.colorIndex, this.highlightAlpha);
            if (existingStyle)
                existingStyle.innerHTML = cssString;
            else
                addStyleToIFrame(iframe, styleClass, cssString)

        })
    }

    removeIframeStyles() {
        this.iframes.forEach((_iframe) => {
            _iframe.getElementsByClassName(`fm-iframe${this.id}`)[0]?.remove();
        });
        this.iframes = [];
    }

    onIframeDiscover(newIFrame) {
        if (!newIFrame)
            return;

        if (!this.iframes.includes(newIFrame)) {
            this.iframes.push(newIFrame);
        }

        const sharedStyleClass = `fm-iframeDefStyle`;
        let existingSharedStyle = newIFrame.getElementsByClassName(sharedStyleClass)[0]
        if (!existingSharedStyle) {
            addStyleToIFrame(newIFrame, sharedStyleClass, SharedHighlightCSS);
        }

        const personalStyleClass = `fm-iframe${this.id}`;
        const existingPersonalStyle = newIFrame.getElementsByClassName(personalStyleClass)[0];
        if (!existingPersonalStyle) {
            addStyleToIFrame(newIFrame, personalStyleClass,
                GetPersonalHighlightCSS(this.id, this.colorIndex, this.highlightAlpha))
        }
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