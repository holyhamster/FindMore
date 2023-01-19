
var ThisTabId;
var TabSearchData;
var ongoingSearch;

const highlightCSS = new CSSStyleSheet();
highlightCSS.replaceSync(".TFHighlight { background-color: red; opacity: 0.5; z-index: 1000; position: absolute; }");

document.addEventListener('keydown', function(e){
  if (e.key == "Escape")
    if (TabSearchData.open)
    {
      TabSearchData.open = false;
      updateBarState(TabSearchData);
      removeHighlight();
      cacheDataToBackground();
    }
});

chrome.runtime.onMessage.addListener(
    function(request, sender) {

      if (!ThisTabId)
        ThisTabId = request.tabId;
      switch (request.message) {

        case "update_search":
          console.log("event go");
          let NEW_SEARCH_STATE = false;
          console.log(request);
          if (request.data) {
              if (!searchDataIsSame(TabSearchData, request.data)) {
                NEW_SEARCH_STATE = true;
                TabSearchData = createAndValidateData(request.data);

              }
          }
          else if (!TabSearchData) {
            NEW_SEARCH_STATE = true;
            TabSearchData = createAndValidateData();
          }

          if (NEW_SEARCH_STATE || request.forcedUpdate)
          {
            updateBarState(TabSearchData);

            removeHighlight();
            if (TabSearchData.open &&
              TabSearchData.searchString != "")
            {
              getTextRectangles(TabSearchData.searchString);
            }
            cacheDataToBackground();
          }
          break;


        default:
          console.log("uncaught message: " + request.message);
      }
    }
  );

function createAndValidateData(_baseData)
{
  var result = _baseData
  if (!result)
    result = new Object();

  result.open = result.open || false;
  result.searchString = result.searchString || "";

  return result;
}

function searchDataIsSame(_data1, _data2)
{
  return (_data1?.searchString === _data2?.searchString) && (_data1?.open == _data2?.open);
}

function updateBarState(_dataRef)
{
  const TFSearchBarID = "TFSearchBar";
  const TFInputBarID = "TFInputBar";

  let bar = document.getElementById(TFSearchBarID);

  if (_dataRef.open) {

    let inputBar = document.getElementById(TFInputBarID);
    if (!bar)
    {
      bar = document.createElement("div");

      bar.setAttribute("id", TFSearchBarID);

      inputBar = document.createElement("input");
      inputBar.setAttribute("id", TFInputBarID)
      inputBar.setAttribute("value", _dataRef.searchString);

      inputBar.addEventListener("input", function(e){
        if (_dataRef.searchString == e.target.value)
          return;

        removeHighlight();
        _dataRef.searchString = e.target.value;
        cacheDataToBackground();
        if (_dataRef.searchString && _dataRef.searchString.length > 0)
        getTextRectangles(_dataRef.searchString);
      });

      bar.appendChild(inputBar);
      bar.style.position = "fixed";
      bar.style.top = "10px";
      bar.style.right = "10px";
      bar.style.backgroundColor = "white";
      bar.style.padding = "10px";
      bar.style.zIndex = 1000;
      document.body.appendChild(bar);



      if (!document.adoptedStyleSheets.includes(highlightCSS))
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, highlightCSS];
    }

    if (inputBar.value != _dataRef.searchString)
    {
      inputBar.setAttribute("value", _dataRef.searchString);
    }
  }

  if (!_dataRef.open && bar){
    bar.remove();
  }
}

async function getTextRectangles(_searchString){
  var perf = new PerformanceMesurer();

  if (!_searchString | _searchString === "")
    return [];
  var DEBUG_MESSAGES = false;
  var condition = {
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

  var node;
  var walk = document.createTreeWalker(document.body, NodeFilter.SHOW_ALL, condition);

  //values to store data of the current search region
  var regionNodes = [];
  var regionOffset = 0;
  var regionString = "";

  const regexSearch = new RegExp(_searchString, "gi");

  //ba aa
  var rects = [];
  var range = document.createRange();
  console.log(`before treewalk: ${perf.get()}`)

  while(node = walk.nextNode())
  {

    if (SEARCH_CHANGED = (!TabSearchData || !TabSearchData.open || TabSearchData.searchString != _searchString))//TODO abstract away the conditions
      return [];

    //add new node to the current search region
    regionString += node.textContent;
    regionNodes.push(node);

    if (DEBUG_MESSAGES)
      console.log(`CYCLE: new node "${node.textContent}" regionString : "${regionString}"`);


    //match the region
    regexSearch.lastIndex = 0;
    let match;
    var safety = 50000;
    while (match = regexSearch.exec(regionString))
    {
      let nodeMatchIndex = match.index + regionOffset;

      let startPos = findNodePosition(regionNodes, nodeMatchIndex, DEBUG_MESSAGES);
      let endPos = findNodePosition(regionNodes, nodeMatchIndex + _searchString.length, DEBUG_MESSAGES);

      if (DEBUG_MESSAGES)
        console.log(`start: ${startPos.index}-index ${startPos.offset}-offset, stend: ${endPos.index}-index ${endPos.offset}-offset`)

      range.setStart(regionNodes[startPos.index], startPos.offset);
      range.setEnd(regionNodes[endPos.index], endPos.offset);

      let newRects = range.getClientRects();
      for (let j = 0; j < newRects.length; j++)
      {
        rects.push(newRects[j]);

        highlightRect(newRects[j]);
      }

      regionString = regionString.substring(match.index + _searchString.length);
      if (regionString != "")
      {
        regionOffset = endPos.offset;
        regionNodes = regionNodes.slice(endPos.index);
        if (DEBUG_MESSAGES)
          console.log(`regionString after match: ${regionString} offset ${regionOffset}`);
      }
      else
      {
        regionNodes = [];
        regionOffset = 0;
      }
      regexSearch.lastIndex = 0;
    }

    //remove nodes from the beginning if the search region is larger than the search string
    while (regionNodes.length > 0 &&
      (regionOffset + regionString.length) - regionNodes[0].textContent.length > _searchString.length - 1)
    {
      if (DEBUG_MESSAGES)
        console.log(`too long, cutting off ${regionNodes[0].textContent}`);
      regionString = regionString.substring(regionNodes[0].textContent.length - regionOffset);
      regionOffset = 0;
      regionNodes.shift();
    }
  }
  console.log(`after treewalk: ${perf.get()}`)
  return rects;
}

function findNodePosition(_nodeArray, _index, _debug)
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
function highlightRect (_rect) {
    let highlightRect = document.createElement('DIV');
    document.body.appendChild(highlightRect);
    highlightRect.classList.add('TFHighlight');
    highlightRect.style.top = _rect.y + window.scrollY + 'px';
    highlightRect.style.left = _rect.x + 'px';
    highlightRect.style.height = _rect.height + 'px';
    highlightRect.style.width = _rect.width + 'px';
}

function removeHighlight () {
  let highlights = document.querySelectorAll('.TFHighlight');
  for (let i = 0; i < highlights.length; i++) {
    highlights[i].remove();
  }
}

function cacheDataToBackground()
{
  message = { message:"update_content", tabId: ThisTabId, data: TabSearchData};
  chrome.runtime.sendMessage(message);
}



function openSearchBar2()
{
  var gethmtl = chrome.runtime.getURL('../search/search.html');

  fetch(gethmtl)
  .then(response => response.text())
  .then(html => {

    var doc = document.implementation.createHTMLDocument("title");
    doc.open();
    doc.write(html);
    doc.close();
    var element = doc.querySelector(".searchbar");
    document.body.appendChild(element);

  });
}

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
//chrome.runtime.sendMessage("content-loaded");
console.log("content script loaded")