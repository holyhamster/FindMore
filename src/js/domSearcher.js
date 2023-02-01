
class DomSearcher{
  interrupted;
  searchString;
  regexString;
  interval = 1;
  consecutiveCalls = 100;
  DEBUG_MESSAGES;



  regexp;
  walk;


  constructor(_searchString, _regexOptions, _debug)
  {
    this.regexString = new RegExp(_searchString, 'gi');

    this.interrupted = false;
    this.searchString = _searchString;
    this.DEBUG_MESSAGES = true;

    this.regexp = new RegExp(_searchString, _regexOptions);

    this.startSearch();

    //this.searchRecursion(
      //this.getWalk(), new RegExp(_searchString, _regexOptions), "", [], 0);
  }

  interrupt()
  {
    console.log("interrupt triggered");
    this.interrupted = true;
  }
  startSearch()
  {
    this.searchRecursive(this.searchString, DomSearcher.initRegion(), [], new Map(), this.getWalk(), this.regexString);
  }
  //iterates through a search region, continues pulling new nodes out of this.walk when search fails
  //makes a timeout everytime it makes too many calls at once (to give the browser some rendering time)
  //
  //_regionNodes are all nodes in the current search region, _regionString is their stacked .contentText starting from _regionOffset index

  searchRecursive(_searchString, _region, _matches, _highlightGroups, _walk, _regexp)
  {
    let callsLeft = this.consecutiveCalls;
    let range = document.createRange();
    let dirtyHLGroups = new Map();
    while(callsLeft >= 0)
    {
      callsLeft -= 1;
      if (_matches.length > 0)
      {
        let match = _matches.shift();
        let dirtyHL = DomSearcher.processMatch(match, _region, range, _highlightGroups);
        if (dirtyHL && !dirtyHLGroups.get(dirtyHL))
          dirtyHLGroups.set(dirtyHL.anchor, dirtyHL.group);

        if (_matches.length == 0)
          DomSearcher.trimRegionToPoint(_region, match.endIndex, match.endOffset);
      }
      else if (callsLeft > 0)
      {

        _matches = DomSearcher.getAllMatches(callsLeft, _region, _searchString, _regexp);
        if (_matches.length == 0)  //try basing this on offset
        {
          let WALK_IN_PROGRESS = DomSearcher.expandRegion(_region, _walk);
          DomSearcher.trimRegion(_region, _searchString);
          if (!WALK_IN_PROGRESS)
          {
            dirtyHLGroups.forEach(DomSearcher.commitChange);
            console.log("end of tree");
            return;
          }
          _matches = DomSearcher.getAllMatches(callsLeft, _region, _searchString, _regexp);
        }
      }
    }

    if (_matches.length != 0)
      console.log ("DANGER, UNHANDLED MATCHES")
    if (this.interrupted)
      return;
    dirtyHLGroups.forEach(DomSearcher.commitChange);

    setTimeout( function() { this.searchRecursive.call(
      this, _searchString, _region, _matches, _highlightGroups, _walk, _regexp) }.bind(this), this.interval);
  }

  static initRegion()
  {
    let region = new Object();
    region.string = "";
    region.nodes = [];
    region.offset = 0;
    return region;
  }

  static expandRegion(_region, _walk)
  {
    let newNode = _walk.nextNode();

    if (!newNode)
      return false;

    _region.string += newNode.textContent;
    _region.nodes.push(newNode);

    return true;
  }

  static nodeHasRelativeParent(_node)
  {
    let cyclingParent = _node.parentNode;
    let result = false;
    while (cyclingParent != null)
    {
      if (cyclingParent.nodeType == Node.ELEMENT_NODE)
      {
        let compStyle = window.getComputedStyle(cyclingParent);
        result = compStyle.getPropertyValue("position") == "relative";
        if (result)
          break;
      }
      cyclingParent = cyclingParent.parentNode;
    }
    return result;
  }

  static processMatch(_match, _region, _range, _highlightGroups)
  {
    let anchorNode = _region.nodes[_match.endIndex];

    let hlGroup = (_highlightGroups.get(anchorNode));
    if (!hlGroup)
    {
      hlGroup = this.createHighlightGroup(document, anchorNode);
      _highlightGroups.set(anchorNode, hlGroup);
    }

    if (!hlGroup.invisible && !hlGroup.anchorRect)
    {
      _range.setStart(anchorNode, anchorNode.textContent.length - 1);
      _range.setEnd(anchorNode, anchorNode.textContent.length);
      let rects = _range.getClientRects();
      hlGroup.invisible = rects.length == 0;
      if (!hlGroup.invisible)
        hlGroup.anchorRect = rects[rects.length - 1];
    }

    if (hlGroup.invisible)
      return;

    _range.setStart(_region.nodes[_match.startIndex], _match.startOffset);
    _range.setEnd(_region.nodes[_match.endIndex], _match.endOffset);
    let highlightRects = _range.getClientRects();

    for (let i = 0; i < highlightRects.length; i++)
    {
      if (highlightRects[i].width != 0 && highlightRects[i].height != 0)
        hlGroup.highlightSpans.push(this.createHighlightSpan(highlightRects[i], hlGroup.anchorRect));
    }

    return {anchor: anchorNode, group: hlGroup};
  }

  static createHighlightSpan(_hightlightRect, _anchorRect)
  {
    let span = document.createElement('SPAN');
    span.classList.add('TFHighlight');
    span.style.height = _hightlightRect.height + 'px';
    span.style.width = _hightlightRect.width + 'px';
    span.style.marginLeft =  _hightlightRect.left - _anchorRect.right + 'px';
    span.style.marginTop = _hightlightRect.top - _anchorRect.top + 'px';
    return span;
  }
  static createHighlightGroup(_document, _anchorNode)
  {
    let hlGroup = new Object();
    hlGroup.highlightSpans = [];
    hlGroup.container = _document.createElement('SPAN');

    if (DomSearcher.nodeHasRelativeParent(_anchorNode))  //absolute position is cheaper to calculate, but requires a relative ancestor.
      hlGroup.container.classList.add('TFContainer');
    else
      hlGroup.container.classList.add('TFContainerRelative');

    return hlGroup
  }
  static getAllMatches(_amount, _region, _searchString, _regexp)
  {

    let matches = [..._region.string.substring(_region.offset).matchAll(_regexp)];
    matches = matches.splice(0, _amount);
    let previousNodesOffset = 0, j = 0;
    for (let i = 0; i < matches.length; i++)
    {
      matches[i].index += _region.offset;
      let MATCH_INSIDE_I_NODE;
      while (MATCH_INSIDE_I_NODE = (previousNodesOffset + _region.nodes[j].textContent.length) <= matches[i].index)
      {
        previousNodesOffset += _region.nodes[j].textContent.length;
        j += 1;
      }

      matches[i].startIndex = j;
      matches[i].startOffset = matches[i].index - previousNodesOffset;

      while (MATCH_INSIDE_I_NODE = (previousNodesOffset + _region.nodes[j].textContent.length < matches[i].index + _searchString.length))
      {
        previousNodesOffset += _region.nodes[j].textContent.length;
        j += 1;
      }
      matches[i].endIndex = j;
      matches[i].endOffset = matches[i].index + _searchString.length - previousNodesOffset;
    }
    return matches;
  }

  static trimRegionToPoint(_region, _index, _offset)
  {
    _region.offset = _offset;
    _region.nodes = _region.nodes.slice(_index);
    _region.string = "";
    for (let i = 0; i < _region.nodes.length; i++)
      _region.string += _region.nodes[i].textContent;
  }

  static trimRegion(_region, _searchString)
  {
    let SEARCH_REGION_IS_UNNESESARY_LOG;
    while(SEARCH_REGION_IS_UNNESESARY_LOG = (_region.nodes.length > 0 &&
      ((_region.string.length) - _region.nodes[0].textContent.length > _searchString.length - 1)))
    {
      _region.string = _region.string.substring(_region.nodes[0].textContent.length);
      _region.nodes.shift();
      _region.offset = 0;
    }
  }


  static commitChange(_highlightGroup, _anchorNode)
  {
    if (_highlightGroup.appended && _highlightGroup.highlightSpans.length > 3)
    {
      _highlightGroup.container.remove();
      _highlightGroup.appended = false;
    }
    //console.log("committing");
    //console.log(_highlightGroup);
    //console.log(_anchorNode);
    for (let i = 0; i < _highlightGroup.highlightSpans.length; i++)
    {
      //console.log(_highlightGroup.highlightSpans[i]);
      _highlightGroup.container.appendChild(_highlightGroup.highlightSpans[i]);
    }

    if (!_highlightGroup.appended)
    {
      _anchorNode.after(_highlightGroup.container);
      _highlightGroup.appended = true;
    }

    _highlightGroup.highlightSpans = [];
    _highlightGroup.anchorRect = null;
  }



  getWalk() {
      const condition = {
        acceptNode: (node) => {
          if (node.nodeName.toUpperCase() == "STYLE" ||
              node.nodeName.toUpperCase() == "SCRIPT")
              {
              return NodeFilter.FILTER_REJECT
            }
          if (node.nodeName.toUpperCase() == "#TEXT" &&
            node.textContent)
            return NodeFilter.FILTER_ACCEPT;

          return NodeFilter.FILTER_SKIP;
        }

      };

      return document.createTreeWalker(document.body, NodeFilter.SHOW_ALL, condition);
  }

  static getFirstRect(_node, _range, _cache)
  {
    let rect = _cache.get(_node);
    if (!rect)
    {
      _range.setStart(_node, _node.textContent.length - 1);
      _range.setEnd(_node, _node.textContent.length);
      let rects = _range.getClientRects();
      if (rects.length == 0)  //sometimes the node isnt visible and it will not have any rects
      {
        return;
      }
      rect = rects[rects.length - 1];
      _cache.set(_node, rect);
    }
    return rect;
  }
}

export default DomSearcher;

class PerformanceMesurer {
  constructor() {
    this.last = performance.now();
  }

  get()
  {
    let val = performance.now() - this.last;
    this.last = performance.now();
    return val;
  }
}