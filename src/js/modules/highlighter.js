import container from './container.js';

class Highlighter
{
    matches = [];       //list of matches from domsearcher
    containers = [];    //highlight spans, index = index in the matches array
    iframeStylesMap = new Map();

    constructor(_id, _eventElem, _primaryColor, _secondaryColor )
    {
        this.id = _id;

        this.intersectionObserver = new IntersectionObserver(entries =>
        {
            if (!entries[0].isIntersecting)
                entries[0].target.scrollIntoView({ block: "center" });

            this.intersectionObserver.unobserve(entries[0].target)
        });

        this.setColors(_primaryColor, _secondaryColor);

        const newMatchesEvent = new Event(`tf-new-matches-update`);
        this.onNewMatches = (_matches) =>
        {
            newMatchesEvent.length = _matches;
            _eventElem.dispatchEvent(newMatchesEvent);
        };

        _eventElem.addEventListener(`tf-iframe-style-update`, function (_args) 
        {
            const iframe = _args.iframe;
            this.iframeStylesMap.get(iframe)?.remove();
            const newStyle = addStyleTag(iframe, getCSSString(this.id, this.primary, this.accent))
            this.iframeStylesMap.set(iframe, newStyle);
        }.bind(this));
    }

    setColors(_primaryColor, _accent)
    {
        this.primary = _primaryColor;
        this.accent = _accent;
        const cssString = getCSSString(this.id, this.primary, this.accent);

        if (!this.adoptedSheet || !document.adoptedStyleSheets.includes(this.adoptedSheet))
        {
            this.adoptedSheet = new CSSStyleSheet();
            document.adoptedStyleSheets = [...document.adoptedStyleSheets, this.adoptedSheet];
            console.log("added");
        }
        this.adoptedSheet.replaceSync(cssString);

        this.iframeStylesMap.forEach((_oldStyle, _iframe) =>
        {
            _oldStyle.remove();
            this.iframeStylesMap.set(_iframe, addStyleTag(_iframe, cssString));
        })
    }

    invoked;
    queMatch(_match)
    {
        
        this.matches.push(_match);
        if (!this.invoked)
        {
            this.invoked = true;
            setTimeout(function () { this.processHighlights.call(this) }.bind(this), 1);
        }
    }

    interrupted;
    consequtiveCalls = 100;
    processHighlights()
    {
        let HAS_UNPROCESSED_MATCHES, callsLeft = this.consequtiveCalls;
        const range = document.createRange(), timeoutInterval = 1, dirtyContainers = [];
        this.invoked = false;
        
        while ((callsLeft -= 1) > 0 &&
            (HAS_UNPROCESSED_MATCHES = (this.matches.length > this.containers.length)))
        {
            ;
            const matchID = this.containers.length, match = this.matches[matchID];
            const container = this.createContainer(match, range);
            if (container)
            {
                this.containers.push(container);
                if (!dirtyContainers.includes(container))
                    dirtyContainers.push(container);
            }
            else
                this.matches.splice(matchID, 1);
        }

        if (this.interrupted)
            return;

        if (dirtyContainers.length > 0)
            this.onNewMatches(this.containers.length);
        dirtyContainers.forEach((_container) => { _container.commit(); })

        let container;
        while (container = this.containersToRemove?.shift())
            container.remove();

        if (this.matches.length != this.containers.length & !this.invoked)
        {
            this.invoked = true;
            setTimeout(function () { this.processHighlights.call(this) }.bind(this), timeoutInterval);
        }
    }

    nodeToContainerMap = new Map();
    createContainer(_match, _range)
    {
        let rects = this.getRects(_match, _range);

        let hlContainer = this.nodeToContainerMap.get(_match.endNode.parentNode);
        if (!hlContainer)
        {
            hlContainer = new container(_match.endNode.parentNode, this.id);
            this.nodeToContainerMap.set(_match.endNode.parentNode, hlContainer);
        }

        let highlightID = this.containers.length;
        let visible = hlContainer.highlightRects(highlightID, rects);

        if (visible)
        {
            return hlContainer;
        }

        return;
    }

    getRects(_match, _range)
    {
        _range.setStart(_match.startNode, _match.startOffset);
        _range.setEnd(_match.endNode, _match.endOffset);

        let nonEmptyRects = [], rects = _range.getClientRects();

        for (let i = 0; i < rects.length; i++)
            if (rects[i].width >= 1 && rects[i].height >= 1)
                nonEmptyRects.push(rects[i]);

        return nonEmptyRects;
    }
    getTotalCount()
    {
        if (this.matches.length != this.containers.length)
            return roundToLeftDigit(this.matches.length);
        return this.containers.length;
    }

    accentMatch(_index)
    {
        const lastAccentedContainer = this.accentedIndex == null? null : this.containers[this.accentedIndex];
        if (lastAccentedContainer)
        {
            lastAccentedContainer.setSelectionAt(this.accentedIndex, false);
            this.accentedIndex = null;
        }

        if (_index >= this.matches.length)
            return;

        let focusTarget, INDEX_IS_BEING_PROCESSED = _index >= this.containers.length;

        if (INDEX_IS_BEING_PROCESSED)
        {
            focusTarget = this.matches[_index].startNode.parentNode;
        }
        else
        {
            this.accentedIndex = _index;
            const accentedRectangles = this.containers[this.accentedIndex].setSelectionAt(_index, true);
            focusTarget = accentedRectangles.length > 0? accentedRectangles[0]: null;
        }
        
        if (focusTarget)
            this.intersectionObserver.observe(focusTarget);
    }

    clearSelection()
    {
        this.containersToRemove = this.containersToRemove || [];
        this.containersToRemove = [...this.containersToRemove, ...Array.from(this.nodeToContainerMap.values())];

        setTimeout(function ()
        {
            let container;
            while (container = this.containersToRemove?.shift())
                container.remove();
        }.bind(this), 100);
        
        this.matches = [];
        this.containers = [];
        this.nodeToContainerMap = new Map();
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
        this.iframeStylesMap.forEach(function (_sheets, _iframe)
        {
            _sheets.remove();
        }.bind(this));
        this.iframeStylesMap = new Map();
    }
}

function addStyleTag(_iframe, _cssString)
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

function getCSSString(_id, _primary, _accent)
{
    return `.TFC${_id} { all:initial; display:inline-block; position: absolute; } ` +
        `.TFCR${_id} { all:initial; display:inline-block; position: relative; } ` +
        `.TFH${_id} { position: absolute; background-color: ${_primary};` +
        ` opacity: 0.7; z-index: 2147483646; } ` +
        `.TFHS${_id} { background-color: ${_accent}; }`;
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