import { GetPersonalCSS, DefaultHighlightCSS } from './cssInjection.js'

//adds and redacts css for highlight rectangles to the document's adopted sheets
//  and iframes (when parent element has an event about locating one)

class Styler
{
    constructor(id, parentElement)
    {
        this.id = id;
        this.parentElement = parentElement;
    }

    set(colorIndex, opacity = .8)
    {
        const personalCSS = GetPersonalCSS(this.id, colorIndex, opacity);
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
                defStyle.innerHTML = defaultCSSString;
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

const defaultCSSString = `fm-container { all:initial; position: absolute; } ` +
    `fm-container.fm-relative { position: relative; display:inline-block; width:0px; height: 0px; } ` +
    `fm-highlight { all:initial; position: absolute; opacity: 0.6; z-index: 2147483646; }`; //` pointer-events: none;`;

function getPersonalCSSString(id, primary, accent, opacity)
{
    return `fm-highlight.fm-${id} {background-color: ${primary}; opacity: ${opacity}; }` +
        `fm-highlight.fm-${id}.fm-accented { background-color: ${accent}; }`;
}

export default Styler;