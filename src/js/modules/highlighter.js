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

        this.setStyle(_primaryColor, _secondaryColor);
    }

    //#region CSS STYLING
    setStyle(_primaryColor, _accent)
    {
        this.defaultCSS = this.defaultCSS || Highlighter.getDefaultCSSString();
        this.personalCSS = Highlighter.getPersonalCSSString(this.id, _primaryColor, _accent);

        this.setAdoptedStyle();
        this.setIFramesStyle();
    }

    setAdoptedStyle()
    {
        if (!Highlighter.adoptedDefaultSheet)
        {
            Highlighter.adoptedDefaultSheet = new CSSStyleSheet();
            Highlighter.adoptedDefaultSheet.replaceSync(this.defaultCSS);
            document.adoptedStyleSheets = [...document.adoptedStyleSheets, Highlighter.adoptedDefaultSheet];
        }

        if (!this.adoptedPersonslSheet || !document.adoptedStyleSheets.includes(this.adoptedPersonslSheet))
        {
            this.adoptedPersonslSheet = new CSSStyleSheet();
            document.adoptedStyleSheets = [...document.adoptedStyleSheets, this.adoptedPersonslSheet];
        }
        this.adoptedPersonslSheet.replaceSync(this.personalCSS);
    }
    removeAdoptedStyle()
    {
        const adoptedCSSIndex = Array.from(document.adoptedStyleSheets).
            findIndex((_style) => { return _style === this.adoptedPersonslSheet; });
        if (adoptedCSSIndex >= 0)
        {
            const adopts = Array.from(document.adoptedStyleSheets);
            adopts.splice(adoptedCSSIndex, 1);
            document.adoptedStyleSheets = adopts;
            this.adoptedPersonslSheet = null;
        }
    }

    iframes = [];
    setIFramesStyle()
    {
        this.iframes.forEach((_iframe) =>
        {
            const oldStyle = _iframe.getElementById(`fm-iframe${this.id}`);
            oldStyle?.remove();
            const newStyle = _iframe.createElement(`style`);
            newStyle.setAttribute("id", `fm-iframe${this.id}`);
            newStyle.innerHTML = this.personalCSS;
            _iframe.head.appendChild(newStyle);
        })

        if (this.iFrameListener != null)
            return;

        this.iFrameListener = (_args) =>
        {
            const newIFrame = _args.iframe.contentDocument;

            if (!this.iframes.includes(newIFrame))
                this.iframes.push(newIFrame);

            let defStyle = newIFrame.getElementById(`fm-iframeDefStyle`)
            if (!defStyle)
            {
                defStyle = newIFrame.createElement("style");
                defStyle.setAttribute("id", "fm-iframeDefStyle");
                defStyle.innerHTML = this.defaultCSS;
                newIFrame.head.appendChild(defStyle);
            }
            
            let personalStyle = newIFrame.getElementById(`fm-iframe${this.id}`);
            if (!personalStyle)
            {
                personalStyle = newIFrame.createElement(`style`);
                personalStyle.setAttribute("id", `fm-iframe${this.id}`);
                personalStyle.innerHTML = this.personalCSS;
                newIFrame.head.appendChild(personalStyle);
            }
        };

        this.parentElement.addEventListener(`tf-iframe-style-update`, this.iFrameListener);
    }

    static getDefaultCSSString()
    {
        return `fm-container { position: absolute; } ` +
            `fm-container.fm-relative { position: relative; } ` +
            `fm-highlight { position: absolute; opacity: 0.7; z-index: 2147483646; }`; //` pointer-events: none;`;
    }

    static getPersonalCSSString(_id, _primary, _accent)
    {
        return `fm-highlight.fm-${_id} {background-color: ${_primary}; }` +
            `fm-highlight.fm-${_id}.fm-accented { background-color: ${_accent}; }`;
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
        const perfMeasurer = new PerformanceMeasurer(), msPerCall = 100, msTimeout = 5;
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
            findIndex((_style) => { return _style === this.adoptedPersonslSheet; });
        if (adoptedCSSIndex >= 0)
        {
            const adopts = Array.from(document.adoptedStyleSheets);
            adopts.splice(adoptedCSSIndex, 1);
            document.adoptedStyleSheets = adopts;
            this.adoptedPersonslSheet = null;
        }
        this.iframes.forEach((_iframe) => { _iframe.getElementById(`fm-iframe${this.id}`)?.remove(); });
        this.iframes = [];
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