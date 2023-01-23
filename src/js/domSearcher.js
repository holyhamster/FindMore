
class DomSearcher{
  interrupted;
  searchString;
  interval = 1;
  consecutiveMax = 20;
  DEBUG_MESSAGES;

  constructor(_searchString, _regexOptions, _debug)
  {
    this.interrupted = false;
    this.searchString = _searchString;
    this.DEBUG_MESSAGES = _debug;

    this.searchRecursion(
      this.getWalk(), document.createRange(), new RegExp(_searchString, _regexOptions),
    "", [], 0);

  }

  interrupt()
  {
    this.interrupted = true;
  }

  searchRecursion(_walk, _range, _regexp, _regionString, _regionNodes, _regionOffset, _consequtiveCalls)
  {
    if (!_consequtiveCalls)
      _consequtiveCalls = 0;

    let node = _walk.nextNode();
    if (!node)
      return;
    var newRange = document.createRange();
    newRange.selectNode(node);
    let allrects = newRange.getClientRects();
    let firstRect;
    if (allrects && allrects.length > 0)
      firstRect = allrects[0];



    //console.log(newRange.setEnd(node, node.textContent.length));

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

      let startPos = this.findNodePosition(_regionNodes, nodeMatchIndex, this.DEBUG_MESSAGES);
      let endPos = this.findNodePosition(_regionNodes, nodeMatchIndex + _regexp.source.length, this.DEBUG_MESSAGES);

      if (this.DEBUG_MESSAGES)
        console.log(`start: ${startPos.index}-index ${startPos.offset}-offset, stend: ${endPos.index}-index ${endPos.offset}-offset`)

      _range.setStart(_regionNodes[startPos.index], startPos.offset);
      _range.setEnd(_regionNodes[endPos.index], endPos.offset);

      if (this.interrupted)
        return;
      let selectionRects = _range.getClientRects();

      let lastNodeRect;
      {
        _range.selectNode(_regionNodes[endPos.index]);
        let allrects = _range.getClientRects();
        if (allrects && allrects.length > 0)
          lastNodeRect = allrects[allrects.length - 1];

      }
      for (let j = 0; j < selectionRects.length; j++)
      {
        //this.highlightRect(selectionRects[j], node);
        //this.addHighlight(_regionNodes[endPos.index], this.getElement(lastNodeRect, selectionRects[j]));
        this.highlightChildTest(selectionRects[j], _regionNodes[endPos.index], lastNodeRect)
      }

      _regionString = _regionString.substring(match.index + _regexp.source.length);
      if (_regionString != "")
      {
        _regionOffset = endPos.offset;
        _regionNodes = _regionNodes.slice(endPos.index);
        if (this.DEBUG_MESSAGES)
          console.log(`regionString after match: ${_regionString} offset ${_regionOffset}`);
      }
      else
      {
        _regionNodes = [];
        _regionOffset = 0;
      }
      _regexp.lastIndex = 0;
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
      this.searchRecursion.call(this, _walk, _range, _regexp, _regionString, _regionNodes, _regionOffset, _consequtiveCalls + 1);
    else
      setTimeout( function() { this.searchRecursion.call(this, _walk, _range, _regexp, _regionString, _regionNodes, _regionOffset) }.bind(this), this.interval);
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

      //values to store data of the current search region


      const regexSearch = new RegExp(_searchString, "gi");

      //ba aa
      var rects = [];
  }

  findNodePosition(_nodeArray, _index, _debug)
  {
    let MATCH_INSIDE_I_NODE = _nodeArray[0].textContent.length < _index;
    let previousNodesOffset = 0, i = 0;
    while (MATCH_INSIDE_I_NODE)
    {
      if (_debug)
        console.log(`node: ${i} + "${_nodeArray[i].textContent}"`);
        previousNodesOffset += _nodeArray[i].textContent.length;
      i += 1;
      MATCH_INSIDE_I_NODE = (previousNodesOffset + _nodeArray[i].textContent.length) < _index;
    }
    if (_debug)
        console.log(`node: ${i} + "${_nodeArray[i].textContent}"`);

    return { index: i, offset: _index - previousNodesOffset };
  }
  getElement(_lastNodeRect, _targetRect)
  {
    console.log("lastnode rect");
    console.log(_lastNodeRect);
    console.log("target selection rect");
    console.log(_targetRect);
    let highlightRect = document.createElement('DIV');
    highlightRect.classList.add('TFHighlight');
    highlightRect.style.height = _targetRect.height + 'px';
    highlightRect.style.width = _targetRect.width + 'px';
    highlightRect.style.marginBottom = -_targetRect.height + 'px';
    //highlightRect.style.marginLeft = -_targetRect.width + 'px';
    highlightRect.style.left = _targetRect.x - _lastNodeRect.right;
    highlightRect.style.marginRight = highlightRect.style.left;
    highlightRect.style.top = _targetRect.y - _lastNodeRect.y;
    highlightRect.style.display = "inline-block";
    highlightRect.style.position = "relative";
    return highlightRect;
  }
  addHighlight (_node, _div) {
    let parent = _node.parentNode;
    if (!parent)
      parent = document;

    parent.insertBefore(_div, _node.nextSibling);
  }

  highlightChildTest(_rect, _node, _lastNodeRect)
  {

    let container = document.createElement('SPAN');
    container.classList.add('TFContainer');
    container.style.position = "relative";
    //container.style.display = "inline-block";
    container.style.width = 0;
    container.style.height = 0;

    let highlightRect = document.createElement('SPAN');
    highlightRect.classList.add('TFHighlight');
    highlightRect.style.height = _rect.height + 'px';
    highlightRect.style.width = _rect.width + 'px';
    highlightRect.style.position = "absolute";
    //highlightRect.style.display = "inline-block";
    highlightRect.style.left = _rect.left - _lastNodeRect.right + 'px';;
    highlightRect.style.top = + _rect.top - _lastNodeRect.top + 'px';

    container.appendChild(highlightRect);
    _node.parentNode.insertBefore(container, _node.nextSibling);
  }

  highlightRect (_rect, _node) {
      let parentBB = _node.parentNode.getBoundingClientRect();
      let highlightRect = document.createElement('DIV');
      highlightRect.classList.add('TFHighlight');
      let wdth = _rect.width;
      let hgt = _rect.height;
      highlightRect.style.top = _rect.y - parentBB.y + 'px';
      console.log(_node);
      console.log(_rect);
      console.log("parent bounding rect:");
      console.log(parentBB);

      highlightRect.style.height = _rect.height + 'px';
      highlightRect.style.marginBottom = -_rect.height + 'px';
      highlightRect.style.width = _rect.width + 'px';
      highlightRect.style.marginLeft = -_rect.width + 'px';

      highlightRect.style.left = _rect.x + _rect.width - parentBB.x + 'px';
      highlightRect.style.top = _rect.y - _rect.height - parentBB.y + 'px';
      highlightRect.style.display = "inline-block";

      highlightRect.style.position = "relative";

      _node.parentNode.insertBefore(highlightRect, _node.nextSibling);
  }
  highlightRectspare (_rect, _node) {
    let highlightRect = document.createElement('DIV');
    console.log(_node.parentNode.getBoundingClientRect());
    //_node.appendChild(highlightRect);
    highlightRect.classList.add('TFHighlight');
    //highlightRect.style.top = _rect.y + window.scrollY + 'px';
    //highlightRect.style.left = _rect.x + 'px';
    highlightRect.style.height = _rect.height + 'px';
    highlightRect.style.width = _rect.width + 'px';
    highlightRect.style.position = "relative";
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