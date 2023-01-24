
class DomSearcher{
  interrupted;
  searchString;
  interval = 1;
  consecutiveMax = 20;
  DEBUG_MESSAGES;

  nodeEndingsMap; //map for saving end rectangles
  range;
  regexp;
  walk;
  results;

  constructor(_searchString, _regexOptions, _debug)
  {
    this.nodeEndingsMap = new Map();
    this.interrupted = false;
    this.searchString = _searchString;
    this.DEBUG_MESSAGES = _debug;
    this.range = document.createRange();
    this.regexp = new RegExp(_searchString, _regexOptions);
    this.walk = this.getWalk();
    this.search("", [], 0, 0);
    this.results = [];
    //this.searchRecursion(
      //this.getWalk(), new RegExp(_searchString, _regexOptions), "", [], 0);
  }

  interrupt()
  {
    this.interrupted = true;
  }

  //iterates through a search region, continues pulling new nodes out of this.walk when search fails
  //makes a timeout everytime it makes too many calls at once (to give the browser some rendering time)
  //
  //_regionNodes are all nodes in the current search region, _regionString is their stacked .contentText starting from _regionOffset index
  search(_regionString, _regionNodes, _regionOffset, _consequtiveCalls)
  {
    if (_consequtiveCalls == 0)
    {
      this.nodeEndingsMap = new Map();
      this.range = document.createRange();
    }
    this.range = document.createRange();
    let match =  this.regexp.exec(_regionString);
    if (this.DEBUG_MESSAGES)
      console.log(`search loop, match: ${match}`);
    if (match)
    {
      let nodeMatchIndex = match.index + _regionOffset; //position of the match in its node

      let selection = this.findSelectionCoordinates(_regionNodes, nodeMatchIndex, this.searchString.length);
      //let selectionStart = this.findNodePosition(_regionNodes, nodeMatchIndex);
      //let selectionEnd = this.findNodePosition(_regionNodes, nodeMatchIndex +  this.searchString.length);
      results.push(_regionNodes[selection.startIndex]);
      this.range.setStart(_regionNodes[selection.startIndex], selection.startOffset);
      this.range.setEnd(_regionNodes[selection.endIndex], selection.endOffset);

      if (this.interrupted)
      {
        if (this.DEBUG_MESSAGES)
            console.log(`interrupted`);
        return;
      }
      let selectionRects = this.range.getClientRects();

      for (let j = 0; j < selectionRects.length; j++)
      {
        if (this.DEBUG_MESSAGES)
        {
          console.log(`highlighting:`);
          console.log(selectionRects[j]);
        }
        this.highlightRectangle(selectionRects[j], _regionNodes[selection.endIndex])
      }

      _regionString = _regionString.substring(match.index + this.searchString.length);
      if (_regionString != "")
      {
        _regionOffset = selection.endOffset;
        _regionNodes = _regionNodes.slice(selection.endIndex);
      }
      else
      {
        _regionNodes = [];
        _regionOffset = 0;
      }
    }
    else  //NO NEW MATCHES
    {
      let SEARCH_REGION_IS_UNNESESARY_LOG;
      while(SEARCH_REGION_IS_UNNESESARY_LOG = (_regionNodes.length > 0 &&
        ((_regionOffset + _regionString.length) - _regionNodes[0].textContent.length > this.searchString.length - 1)))
      {

        _regionString = _regionString.substring(_regionNodes[0].textContent.length - _regionOffset);
        _regionOffset = 0;
        _regionNodes.shift();
      }

      let newNode = this.walk.nextNode();
      let END_OF_TREEWALK = !newNode;
      if (END_OF_TREEWALK)
      {
        if (this.DEBUG_MESSAGES)
          console.log("end of tree");
        return;
      }

      _regionString += newNode.textContent;
      _regionNodes.push(newNode);

      if (this.DEBUG_MESSAGES)
      {
        console.log(`adding: new node:`);
        console.log(newNode);
        console.log(`regionString : "${_regionString}"`);
      }
    }

    if (_consequtiveCalls > this.consecutiveMax)
    {
      console.log("timeout");
      setTimeout( function() { this.search.call(this, _regionString, _regionNodes, _regionOffset, 0) }.bind(this), this.interval);
    }
    else
      this.search.call(this,  _regionString, _regionNodes, _regionOffset, _consequtiveCalls + 1);

  }
  searchRecursion(_walk, _regexp, _regionString, _regionNodes, _regionOffset, _consequtiveCalls)
  {
    if (!_consequtiveCalls)
      _consequtiveCalls = 0;

    let node = _walk.nextNode();
    if (!node)
      return;

    //add new node to the current search region
    _regionString += node.textContent;
    _regionNodes.push(node);

    if (this.DEBUG_MESSAGES)
      console.log(`CYCLE: new node "${node.textContent}" regionString : "${_regionString}"`);


    //match the region
    _regexp.lastIndex = 0;
    let match;

    while (match = _regexp.exec(_regionString))
    {
      let nodeMatchIndex = match.index + _regionOffset;

      let selectionStart = this.findNodePosition(_regionNodes, nodeMatchIndex);
      let selectionEnd = this.findNodePosition(_regionNodes, nodeMatchIndex + _regexp.source.length - 1);

      if (this.DEBUG_MESSAGES)
        console.log(`start: ${selectionStart.index}-index ${selectionStart.offset}-offset,
          stend: ${selectionEnd.index}-index ${selectionEnd.offset}-offset`);

      this.range.setStart(_regionNodes[selectionStart.index], selectionStart.offset);
      this.range.setEnd(_regionNodes[selectionEnd.index], selectionEnd.offset);

      if (this.interrupted)
        return;
      let selectionRects = this.range.getClientRects();

      for (let j = 0; j < selectionRects.length; j++)
      {
        //this.highlightRect(selectionRects[j], node);
        //this.addHighlight(_regionNodes[endPos.index], this.getElement(lastNodeRect, selectionRects[j]));
        this.highlightRectangle(selectionRects[j], _regionNodes[selectionEnd.index])
      }

      _regionString = _regionString.substring(match.index + _regexp.source.length);
      if (_regionString != "")
      {
        _regionOffset = selectionEnd.offset;
        _regionNodes = _regionNodes.slice(selectionEnd.index);
        if (this.DEBUG_MESSAGES)
          console.log(`regionString after match: ${_regionString} offset ${_regionOffset}`);
      }
      else
      {
        _regionNodes = [];
        _regionOffset = 0;
      }
    }

    //remove nodes from the beginning if the search region is larger than the search string
    while (_regionNodes.length > 0 &&
      (_regionOffset + _regionString.length) - _regionNodes[0].textContent.length > this.searchString.length - 1)
    {
      if (this.DEBUG_MESSAGES)
        console.log(`too long, cutting off ${_regionNodes[0].textContent}`);
        _regionString = _regionString.substring(_regionNodes[0].textContent.length - _regionOffset);
        _regionOffset = 0;
        _regionNodes.shift();
    }

    if (_consequtiveCalls < this.consecutiveMax)
      this.searchRecursion.call(this, _walk, _regexp, _regionString, _regionNodes, _regionOffset, _consequtiveCalls + 1);
    else
      setTimeout( function() { this.searchRecursion.call(this, _walk, _regexp, _regionString, _regionNodes, _regionOffset) }.bind(this), this.interval);
  }

  getWalk()
  {
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

  getNodeEndRect(_node)
  {
    if (!this.nodeEndingsMap.get(_node))
    {
      this.range.selectNode(_node);
      let allrects = this.range.getClientRects();

      if (allrects.length == 0)
        return this.getNodeEndRect(_node.previousSibling);
      this.nodeEndingsMap.set(_node, allrects[allrects.length - 1]);
    }

    return this.nodeEndingsMap.get(_node);
  }

  findSelectionCoordinates(_nodeArray, _matchIndex, _matchLength)
  {
    let previousNodesOffset = 0, i = 0;
    let MATCH_INSIDE_I_NODE;
    while (MATCH_INSIDE_I_NODE = (previousNodesOffset + _nodeArray[i].textContent.length) <= _matchIndex)
    {
      if (this.DEBUG_MESSAGES)
        console.log(`node: ${i} = "${_nodeArray[i].textContent}"`);
      previousNodesOffset += _nodeArray[i].textContent.length;
      i += 1;
    }
    let startIndex = i;
    let startOffset = _matchIndex - previousNodesOffset;

    while (MATCH_INSIDE_I_NODE = (previousNodesOffset + _nodeArray[i].textContent.length < _matchIndex + _matchLength))
    {
      previousNodesOffset += _nodeArray[i].textContent.length;
      i += 1;
    }
    let endIndex = i;
    let endOffset = _matchIndex + _matchLength - previousNodesOffset;

    return { startIndex: startIndex, startOffset: startOffset, endIndex: endIndex, endOffset: endOffset };
  }
  //takes in an array of nodes and a character index.
  //returns the number of the array where the charactter falls and offset for the index in that node.
  findNodePosition(_nodeArray, _index)
  {
    let previousNodesOffset = 0, i = 0;
    let MATCH_INSIDE_I_NODE;
    while (MATCH_INSIDE_I_NODE = (previousNodesOffset + _nodeArray[i].textContent.length) <= _index)
    {
      if (this.DEBUG_MESSAGES)
        console.log(`node: ${i} = "${_nodeArray[i].textContent}"`);
      previousNodesOffset += _nodeArray[i].textContent.length;
      i += 1;
    }
    if (this.DEBUG_MESSAGES)
        console.log(`node: ${i} = "${_nodeArray[i].textContent}"`);

    return { index: i, offset: _index - previousNodesOffset };
  }


  highlightRectangle(_highlightRect, _endNode)
  {
    let container = document.createElement('SPAN');
    container.classList.add('TFContainer');
    container.style.position = "relative";
    container.style.width = 0;
    container.style.height = 0;

    if (this.DEBUG_MESSAGES)
      console.log(_endNode);
    let lastNodeRect = this.getNodeEndRect(_endNode);

    let highlightRect = document.createElement('SPAN');
    highlightRect.classList.add('TFHighlight');
    highlightRect.style.height = _highlightRect.height + 'px';
    highlightRect.style.width = _highlightRect.width + 'px';
    highlightRect.style.position = "absolute";
    highlightRect.style.left = _highlightRect.left - lastNodeRect.right + 'px';;
    highlightRect.style.top = _highlightRect.top - lastNodeRect.top + 'px';

    container.appendChild(highlightRect);
    _endNode.parentNode.insertBefore(container, _endNode.nextSibling);
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