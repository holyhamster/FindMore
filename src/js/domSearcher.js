import HighlightGroup from './highlightGroup.js';
import SearchRegion from './searchRegion.js';

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
    //this.showNodes()
    const region = new SearchRegion(this.getWalk(), this.searchString, this.regexString);
    this.searchRecursive(region, [], new Map());
  }
  //iterates through a search region, continues pulling new nodes out of this.walk when search fails
  //makes a timeout everytime it makes too many calls at once (to give the browser some rendering time)
  //
  //_regionNodes are all nodes in the current search region, _regionString is their stacked .contentText starting from _regionOffset index
  showNodes()
  {
    let dogg = document.createTreeWalker(document.body, NodeFilter.SHOW_ALL);
    let node;
    while(node = dogg.nextNode())
    {
      console.log(node);
    }
  }
  searchRecursive(_searchRegion, _matches, _highlightGroups)
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
        let newHL = DomSearcher.processMatch(match, _searchRegion, range, _highlightGroups);
        if (newHL && !dirtyHLGroups.get(newHL))
          dirtyHLGroups.set(newHL.parent, newHL.group);

        if (_matches.length == 0)
          _searchRegion.trimToPoint(match.endIndex, match.endOffset);
      }
      else if (callsLeft > 0)
      {

        _matches = _searchRegion.getMatches(callsLeft);
        if (_matches.length == 0)  //try basing this on offset <<--???
        {
          let WALK_IN_PROGRESS = _searchRegion.addNextNode();

          if (!WALK_IN_PROGRESS)
          {
            dirtyHLGroups.forEach(function(_hlGroup) {_hlGroup.commit(); });
            console.log("end of tree");
            return;
          }
          _matches = _searchRegion.getMatches(callsLeft);
        }
      }
    }

    if (_matches.length != 0)
      console.log ("DANGER, UNHANDLED MATCHES")

    if (this.interrupted)
      return;

    dirtyHLGroups.forEach(function(_hlGroup) {_hlGroup.commit(); });

    setTimeout( function() { this.searchRecursive.call(
      this, _searchRegion, _matches, _highlightGroups) }.bind(this), this.interval);
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

    let newLineOffset = DomSearcher.checkForNewLine(newNode);
    if (newLineOffset)
    {
      if (newLineOffset == newNode.textContent.length - 1)
      {

      }
      _region.nodes = [newNode];
    }
    _region.string += newNode.textContent;
    _region.nodes.push(newNode);

    return true;
  }

  static processMatch(_match, _region, _range, _highlightGroups)
  {
    let parentNode = _region.nodes[_match.endIndex].parentNode;

    let hlGroup = (_highlightGroups.get(parentNode));
    if (!hlGroup)
    {
      hlGroup = new HighlightGroup(parentNode, _range);
      _highlightGroups.set(parentNode, hlGroup);

    }
    if (!hlGroup.isGroupVisibleAfterUpdate(_range))
      return;

    _range.setStart(_region.nodes[_match.startIndex], _match.startOffset);
    _range.setEnd(_region.nodes[_match.endIndex], _match.endOffset);

    hlGroup.highlightRange(_range);

    return {parent: parentNode, group: hlGroup};
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

  static checkForNewLine()
  {

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