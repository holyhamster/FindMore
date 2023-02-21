import HighlightContainer from './highlightContainer.js';

class Highlighter
{
    nodeToContainerMap = new Map();
    containers = [];            //index of the array is the index of the match
    iframeCSSMap = new Map();
    dirtyContainers = [];

    constructor(_id, _eventElem, _primaryColor, _secondaryColor, )
    {
        this.id = _id;

        this.intersectionObserver = new IntersectionObserver(entries =>
        {
            if (!entries[0].isIntersecting)
                entries[0].target.scrollIntoView({ block: "center" });

            this.intersectionObserver.unobserve(entries[0].target)
        });

        this.cssString =
            `.TFC${this.id} { position: absolute; }` +
            `.TFCR${this.id} { position: relative; }` +
            `.TFH${this.id} { position: absolute; background-color: ${_primaryColor};` +
                ` opacity: 0.8; z-index: 147483647;}` +
            `.TFHS${this.id} { border: 5px solid ${_secondaryColor}; padding: 0px;}`

        let cssSheet = new CSSStyleSheet();
        cssSheet.replaceSync(this.cssString);
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, cssSheet];

        let newMatchesEvent = new Event(`tf-matches-update`);
        this.onNewMatches = (_matches) =>
        {
            newMatchesEvent.length = _matches;
            _eventElem.dispatchEvent(newMatchesEvent);
        };

        let newIFramesEvent = new Event(`tf-iframe-style-update`);
        this.onNewIFrame = (_iframe) =>
        {
            newIFramesEvent.iframe = _iframe;
            _eventElem.dispatchEvent(newIFramesEvent);
        };

        _eventElem.addEventListener(`tf-iframe-style-update`, function (_args) 
        {
            addCSSToIFrame(_args.iframe, this.cssString, this.iframeCSSMap)
        }.bind(this));
    }

    getIFrameEvent()
    {
        return this.onNewIFrame;
    }

    addMatch(_match, _range)
    {
        let rects = this.getRects(_match, _range);

        let hlContainer = this.nodeToContainerMap.get(_match.endNode.parentNode);
        if (!hlContainer)
        {
            hlContainer = new HighlightContainer(_match.endNode.parentNode, this.id);
            this.nodeToContainerMap.set(_match.endNode.parentNode, hlContainer);
        }

        let highlightID = this.containers.length;
        let visible = hlContainer.highlightRects(highlightID, rects);

        if (visible)
        {
            this.containers.push(hlContainer);
            if (!this.dirtyContainers.includes(hlContainer))
                this.dirtyContainers.push(hlContainer);
        }

        return visible;
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

    commitDirtySpans()
    {
        for (let i = 0; i < this.dirtyContainers.length; i++)
            this.dirtyContainers[i].commit();

        if (this.dirtyContainers.length > 0)
            this.onNewMatches(this.containers.length);
        this.dirtyContainers = [];
    }

    isDirty()
    {
        return this.dirtyContainers.length > 0;
    }

    selectHighlight(_index)
    {
        if (this.selectedIndex != null)
            this.containers[this.selectedIndex].resetSelection(this.selectedIndex);

        this.selectedIndex = _index;


        let selectionSpans = this.containers[this.selectedIndex].selectAt(_index);
        if (selectionSpans.length > 0)
            this.intersectionObserver.observe(selectionSpans[0]);
    }
    clearAll()
    {
        removeDOMClass(document, `TFC${this.id}`);
        removeDOMClass(document, `TFCR${this.id}`);
        this.iframeCSSMap.forEach(function (_sheets, _iframe)
        {
            removeDOMClass(_iframe.contentDocument, `TFC${this.id}`);
            removeDOMClass(_iframe.contentDocument, `TFCR${this.id}`);
            _sheets.remove();
        }.bind(this));
    }
}

function addCSSToIFrame(_iframe, _cssString, _iframeToStylesMap)
{
    let existingStyle = _iframeToStylesMap.get(_iframe);
    if (!existingStyle)
    {
        existingStyle = _iframe.contentDocument.createElement("style");
        existingStyle.setAttribute("class", "TFIframeStyle");
        existingStyle.innerHTML = _cssString;
        _iframeToStylesMap.set(_iframe, existingStyle)
    }

    if (existingStyle.parentNode != _iframe.contentDocument.head)
    {
        _iframe.contentDocument.head.appendChild(existingStyle);
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
export default Highlighter;