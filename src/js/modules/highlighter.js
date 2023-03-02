import Container from './container.js';
import PerformanceMeasurer from './performanceMeasurer.js';

class Highlighter
{
    constructor(_id, _eventElem, _primaryColor, _secondaryColor )
    {
        this.id = _id;
        this.parentElement = _eventElem;

        const newMatchesEvent = new Event(`tf-new-matches-update`);
        this.onNewMatches = (_newMatchCount) =>
        {
            newMatchesEvent.length = _newMatchCount;
            _eventElem.dispatchEvent(newMatchesEvent);
        };

        this.setColors(_primaryColor, _secondaryColor);
    }

    //#region CSS STYLING
    setColors(_primaryColor, _accent)
    {
        const cssString = Highlighter.getCSSString(this.id, _primaryColor, _accent);

        this.setAdoptedStyle(cssString);
        this.setIFramesStyle(cssString);
    }

    setAdoptedStyle(_css)
    {
        if (!this.adoptedSheet || !document.adoptedStyleSheets.includes(this.adoptedSheet))
        {
            this.adoptedSheet = new CSSStyleSheet();
            document.adoptedStyleSheets = [...document.adoptedStyleSheets, this.adoptedSheet];
        }
        this.adoptedSheet.replaceSync(_css);
    }
    removeAdoptedStyle()
    {
        const adoptedCSSIndex = Array.from(document.adoptedStyleSheets).
            findIndex((_style) => { return _style === this.adoptedSheet; });
        if (adoptedCSSIndex >= 0)
        {
            const adopts = Array.from(document.adoptedStyleSheets);
            adopts.splice(adoptedCSSIndex, 1);
            document.adoptedStyleSheets = adopts;
            this.adoptedSheet = null;
        }
    }

    iframeStylesMap = new Map();
    setIFramesStyle(_css)
    {
        this.iframeStylesMap?.forEach((_oldStyle, _iframe) =>
        {
            _oldStyle.remove();
            this.iframeStylesMap.set(_iframe, addStyleTag(_iframe, _css));
        })

        if (this.iFrameListener != null)
            this.parentElement.removeEventListener(`tf-iframe-style-update`, this.iFrameListener);

        this.iFrameListener = (_args) => {
            const iframe = _args.iframe;
            this.iframeStylesMap.get(iframe)?.remove();
            const newStyle = Highlighter.addStyleTag(iframe, _css)
            this.iframeStylesMap.set(iframe, newStyle);
        };

        this.parentElement.addEventListener(`tf-iframe-style-update`, this.iFrameListener);
    }

    static addStyleTag(_iframe, _cssString)
    {
        let style = _iframe.contentDocument.createElement("style");
        style.setAttribute("class", "TFIframeStyle");
        style.innerHTML = _cssString;
        if (style.parentNode != _iframe.contentDocument.head)
        {
            _iframe.contentDocument.head.appendChild(style);
        }

        return style;
    }

    static getCSSString(_id, _primary, _accent)
    {
        return `.TFC${_id} { all:initial; display:inline-block; position: absolute;  } ` +
            `.TFCR${_id} { all:initial; display:inline-block; position: relative; } ` +
            `.TFH${_id} { position: absolute; background-color: ${_primary};` +
            ` opacity: 0.7; z-index: 2147483646; pointer-events: none;} ` +
            `.TFHS${_id} { background-color: ${_accent}; }`;
    }

    
    //#endregion

    //#region RECURSIVE HIGHLIGHT 
    matches = [];       //que of DOMSearcher matches for processing
    containers = [];    //processed matches
    invoked;
    queMatches(_matches)
    {
        this.matches = [...this.matches, ..._matches];
        this.interrupted = false;
        if (this.invoked)
            return;

        this.invoked = true;
        setTimeout(() => { this.processHighlights() }, 1);
    }

    interrupted;
    consequtiveCalls = 100;
    processHighlights()
    {
        const perfMeasurer = new PerformanceMeasurer(), msPerCall = 200, msTimeout = 5;
        let totalTime = 0;
        const range = document.createRange(), dirtyContainers = [];

        this.invoked = false;
        
        while ((totalTime += perfMeasurer.get()) < msPerCall && (this.matches.length > 0) && !this.interrupted)
        {
            
            const match = this.matches.shift();
            const container = this.createContainer(match, range);
            if (container)
            {
                this.containers.push(container);
                if (!dirtyContainers.includes(container))
                    dirtyContainers.push(container);
            }
        }

        if (!this.interrupted)
        {
            dirtyContainers.forEach((_container) => { _container.commit(); })
            if (dirtyContainers.length > 0)
                this.onNewMatches(this.getMatchCount());
        }

        this.removeOldContainers();
        

        if (!this.invoked && !this.interrupted && this.matches.length > 0)
        {
            this.invoked = true;
            setTimeout(() => { this.processHighlights() }, msTimeout);
        }
    }

    nodeToContainerMap = new Map(); //map of container spans that hold highlighted rectangles to their parent nodes
    createContainer(_match, _range)
    {
        const rects = this.getHighlightRectangles(_match, _range);

        let hlContainer = this.nodeToContainerMap.get(_match.endNode.parentNode);
        if (!hlContainer)
        {
            hlContainer = new Container(_match.endNode.parentNode, this.id);
            this.nodeToContainerMap.set(_match.endNode.parentNode, hlContainer);
        }

        const highlightID = this.containers.length;
        const visible = hlContainer.highlightRects(highlightID, rects);

        if (visible)
            return hlContainer;

        return;
    }

    getHighlightRectangles(_match, _range)
    {
        _range.setStart(_match.startNode, _match.startOffset);
        _range.setEnd(_match.endNode, _match.endOffset);

        const rects = Array.from(_range.getClientRects()), nonEmptyRects = [];

        while (rects.length > 0)
        {
            const rect = rects.shift();
            if (rect.width >= 1 && rect.height >= 1)
                nonEmptyRects.push(rect);
        }

        return nonEmptyRects;
    }
    //#endregion

    getMatchCount(_includeUnprocessed = true)
    {
        return this.containers.length + (_includeUnprocessed ? this.matches.length: 0);
    }

    accentMatch(_index)
    {
        const lastAccentedContainer = this.containers[this.accentedIndex];
        if (lastAccentedContainer)
        {
            lastAccentedContainer.setSelectionAt(this.accentedIndex, false);
            this.accentedIndex = null;
        }

        let focusTarget;
        if (_index < this.containers.length)
        {
            this.accentedIndex = _index;
            const accentedRectangles = this.containers[this.accentedIndex].setSelectionAt(_index, true);
            focusTarget = accentedRectangles.length > 0 ? accentedRectangles[0] : null;
        }
        else if (_index < this.containers.length + this.matches.length)
        {
            const match = this.matches[_index - this.containers.length];
            focusTarget = match?.startNode.parentNode;
        }

        if (!focusTarget)
            return;

        this.intersectionObserver = this.intersectionObserver ||
            new IntersectionObserver(entries => 
            {
                if (!entries[0].isIntersecting)
                    entries[0].target.scrollIntoView({ block: "center" });
                this.intersectionObserver.unobserve(entries[0].target)
            });

        this.intersectionObserver.observe(focusTarget);
    }

    oldContainers = [];
    clearSelection()
    {
        this.interrupted = true;
        this.oldContainers = [...this.oldContainers, ...Array.from(this.nodeToContainerMap.values())];

        setTimeout(() => this.removeOldContainers(), 100);
        
        this.matches = [];
        this.containers = [];
        this.nodeToContainerMap = new Map();
    }
    removeOldContainers()
    {
        let container;
        while (container = this.oldContainers.shift())
            container.remove();
    }

    clearStyles()
    {
        const adoptedCSSIndex = Array.from(document.adoptedStyleSheets).
            findIndex((_style) => { return _style === this.adoptedSheet; });
        if (adoptedCSSIndex >= 0)
        {
            const adopts = Array.from(document.adoptedStyleSheets);
            adopts.splice(adoptedCSSIndex, 1);
            document.adoptedStyleSheets = adopts;
            this.adoptedSheet = null;
        }
        this.iframeStylesMap.forEach((_sheets, _iframe) => { _sheets.remove();});
        this.iframeStylesMap = new Map();
    }
}



function removeDOMClass(_document, _className)
{
    if (!_document)
        return;

    let highlights = _document.querySelectorAll(`.${_className}`);

    for (let i = 0; i < highlights.length; i++)
    {
        highlights[i].remove();
    }
}

function roundToLeftDigit(_number)
{
    return _number.toString()[0] + "0".repeat(_number.toString().length - 1)
}
export default Highlighter;