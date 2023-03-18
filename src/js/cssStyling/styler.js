import { GetHighlightsCSS, DefaultHighlightCSS } from './cssInjection.js'
import { GetOptionsChangeEvent, GetClosePanelsEvent } from '../search.js'

//Adds and edits css elements for highlight rectangles

export class Styler
{
    constructor(id, parentElement, colorIndex, opacity = .8)
    {
        this.id = id;
        this.parentElement = parentElement;
        this.colorIndex = colorIndex;
        this.opacity = opacity;

        parentElement.addEventListener(
            GetClosePanelsEvent().type,
            () => this.clearStyles());

        parentElement.addEventListener(
            GetOptionsChangeEvent().type,
            (args) =>
            {
                if (args?.options.highlightAlpha)
                {
                    this.opacity = args.options.highlightAlpha;
                    this.updateStyle();
                }
            });

        this.updateStyle();
    }

    SetColor(colorIndex)
    {
        this.colorIndex = colorIndex;
        this.updateStyle();
    }

    updateStyle()
    {
        const personalCSS = GetHighlightsCSS(this.id, this.colorIndex, this.opacity);
        this.setAdoptedStyle(personalCSS);
        this.setIFramesStyle(personalCSS);
    }

    adoptedSheet;
    setAdoptedStyle(personalCSS)
    {
        if (!Styler.defaultSheet)
        {
            Styler.defaultSheet = new CSSStyleSheet();
            Styler.defaultSheet.replaceSync(DefaultHighlightCSS);
            document.adoptedStyleSheets =
                [...document.adoptedStyleSheets, Styler.defaultSheet];
        }

        if (!this.adoptedSheet ||
            !document.adoptedStyleSheets.includes(this.adoptedSheet))
        {
            this.adoptedSheet = new CSSStyleSheet();
            document.adoptedStyleSheets = [...document.adoptedStyleSheets, this.adoptedSheet];
        }
        this.adoptedSheet.replaceSync(personalCSS);
    }
    removeAdoptedStyle()
    {
        const adoptedCSSIndex = Array.from(document.adoptedStyleSheets).
            findIndex((_style) => { return _style === this.adoptedSheet; });
        if (isNaN(adoptedCSSIndex))
            return;
        const currentAdoptedArray = Array.from(document.adoptedStyleSheets);
        currentAdoptedArray.splice(adoptedCSSIndex, 1);
        document.adoptedStyleSheets = currentAdoptedArray;
        this.adoptedSheet = null;
    }

    iframes = [];
    setIFramesStyle(personalCSS)
    {
        const styleClass = `fm-iframe${this.id}`;
        this.iframes.forEach((_iframe) =>
        {
            const oldStyle = _iframe.getElementsByClassName(styleClass)[0];
            oldStyle?.remove();
            const newStyle = _iframe.createElement(`style`);
            newStyle.setAttribute("class", styleClass);
            newStyle.innerHTML = personalCSS;
            _iframe.head.appendChild(newStyle);
        })

        if (this.iFrameListener != null)
            return;

        this.iFrameListener = (_args) =>
        {
            const newIFrame = _args.iframe.contentDocument;

            if (!this.iframes.includes(newIFrame))
            {
                this.iframes.push(newIFrame);
            }
            let defStyle = newIFrame.getElementsByClassName(`fm-iframeDefStyle`)[0]
            if (!defStyle)
            {
                defStyle = newIFrame.createElement("style");
                defStyle.setAttribute("class", "fm-iframeDefStyle");
                defStyle.innerHTML = DefaultHighlightCSS;
                newIFrame.head.appendChild(defStyle);
            }

            let personalStyle = newIFrame.getElementsByClassName(styleClass)[0];
            if (!personalStyle)
            {
                personalStyle = newIFrame.createElement(`style`);
                personalStyle.setAttribute("class", styleClass);
                personalStyle.innerHTML = personalCSS;
                newIFrame.head.appendChild(personalStyle);
            }
        };

        this.parentElement.addEventListener(`fm-new-iframe`, this.iFrameListener);
    }

    removeIframeStyles()
    {
        this.iframes.forEach((_iframe) =>
        {
            _iframe.getElementsByClassName(`fm-iframe${this.id}`)[0]?.remove();
        });
        this.iframes = [];
        if (this.iFrameListener)
            this.parentElement.removeEventListener(`fm-new-iframe`, this.iFrameListener);
    }

    clearStyles()
    {
        this.removeAdoptedStyle();
        this.removeIframeStyles();
    }
}

export function GetStyleChangeEvent(args)
{
    const event = new Event("fm-style-change");
    Object.assign(event, args);
    return event;
}