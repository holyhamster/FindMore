
var ThisTabId;
var TabSearchValue;
var SearchOpen = false;

document.addEventListener('keydown', function(e){
  if (e.key == "Escape")
    if (SearchOpen)
    {
      closeSearchBar();
      sendSearchContentToBackground();
    }
});

chrome.runtime.onMessage.addListener(
    function(request, sender) {
      if (!ThisTabId)
        ThisTabId = request.tabId;
      switch (request.message) {
        case "open_search":
          openSearchBar(request.data);
          break;
        case "tab_updated":
          onTabUpdate(request.data, request.state);
          break;
        default:
          console.log("uncaught message: " + request.message);
      }
    }
  );

  function openSearchBar(_backgroundSearchValue)
  {
    if (SearchOpen)
      return;

    SearchOpen = true;
    if (!TabSearchValue)
    {
      if (_backgroundSearchValue == null)
      {
        TabSearchValue = new Object();
        TabSearchValue.searchString = "";
      }
      else
      {
        TabSearchValue = _backgroundSearchValue;
      }
    }

    renderSearchContent(TabSearchValue.searchString);
  }

  function closeSearchBar()
  {
    if (!SearchOpen)
      return;

    SearchOpen = false;
    var getbar = document.getElementById("TagFind_SearchBar");
    getbar.remove();
  }

function renderSearchContent(_searchString)
{
    var floatingDiv = document.createElement("div");

    floatingDiv.setAttribute("id", "TagFind_SearchBar");

    var inputBar = document.createElement("input");
    inputBar.setAttribute("value", _searchString);

    inputBar.addEventListener("input", function(e){
      onSearchValueChange(e.target.value);
    });

    floatingDiv.appendChild(inputBar);
    floatingDiv.style.position = "fixed";
    floatingDiv.style.top = "10px";
    floatingDiv.style.right = "10px";
    floatingDiv.style.backgroundColor = "white";
    floatingDiv.style.padding = "10px";
    floatingDiv.style.zIndex = 1000;
    document.body.appendChild(floatingDiv);
}

function onTabUpdate(_bgSearchValue, _bgState)
{
  if (!TabSearchValue & _bgSearchValue)
    TabSearchValue = _bgSearchValue;

  if (!SearchOpen & _bgState)
  {
    openSearchBar(_bgSearchValue);
  }
}

const highlightWholeWords = (node, regexSearch) => {
  let range = document.createRange();
  let rects = [];
  let rMatch;
  regexSearch.lastIndex = 0;
  while (rMatch = regexSearch.exec(node.textContent))
  {
    const preNode = document.createTextNode(node.textContent.substring(0, rMatch.index));
    const hit = createHighlighted(node.textContent.substring(rMatch.index, rMatch.index + rMatch.length));

    node.textContent = node.textContent.substring(rMatch.index + rMatch.length);
    node.parentElement.insertBefore(preNode, node);
    node.parentElement.insertBefore(hit, node);
    regexSearch.lastIndex = 0;
  }
};

const createHighlighted = (text) => {
  const span = document.createElement("span");
  span.style.backgroundColor = "red";
  const textNode = document.createTextNode(text);
  span.appendChild(textNode);
  return span;
}

const highlightRects = (rects) => {
  for (let i = 0; i < rects.length; i++) {

    let rect = rects[i];
    let highlightRect = document.createElement('DIV')
    document.body.appendChild(highlightRect)
    highlightRect.classList.add('tagFindHighlight')
    highlightRect.style.top = rect.y + window.scrollY + 'px'
    highlightRect.style.left = rect.x + 'px'
    highlightRect.style.height = rect.height + 'px'
    highlightRect.style.width = rect.width + 'px'
    highlightRect.style.backgroundColor = "red";
  }
}

const getRect = (node, start, length) => {


  range.setStart(node, start);
  range.setEnd(node)
}
const highlightBorderWords = (nodeArray, regexSearch) => {


  let allNodesString = "";
  nodeArray.forEach(element => { allNodesString += element.textContent; });
  console.log(`bordermatch activated: ${allNodesString} `);
  regexSearch.lastIndex = 0;
  let rMatch = regexSearch.exec(allNodesString);
  const firstNode = nodeArray[0];
  const lastNode = nodeArray[nodeArray.length - 1];
  console.log(regexSearch + ' on ' + allNodesString);

  const highlightedStart = createHighlighted(firstNode.textContent.substring(rMatch.index));

  firstNode.parentElement.insertBefore(highlightedStart, firstNode.nextSibling);
  firstNode.textContent = firstNode.textContent.substring(0, rMatch.index);

  for (let i = 1; i < nodeArray.length - 1; i ++)
  {
    nodeArray[i].innerHTML = createHighlighted(nodeArray[i].textContent).innerHTML;
  }

  const postNodePosition = rMatch.index + rMatch.length - (allNodesString.length - lastNode.length);
  const highlightedEnd = createHighlighted(lastNode.textContent.substring(0, postNodePosition));

  lastNode.parentElement.insertBefore(highlightedEnd, lastNode);
  lastNode.textContent = nodeArray[0].textContent.substring(postNodePosition);

  console.log(`firstnode ${firstNode.innerHTML} lastnode ${lastNode.innerHTML}`);
};

function textNodesUnder(el, wordToFind){
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
  var walk = document.createTreeWalker(el,NodeFilter.SHOW_ALL, condition);

  var currentStringNodes = [];  //array to store nodes for current string
  var occurances = 0;  //array to store hits for current string
  var currentString = ""; //buffer string to check for hits in-between nodes


  //aaa
  //aaaa a a a aa
  const lengthOfNodes = (array) => {
    let length = 0;
    array.forEach(element => { length += element.textContent.length })
    return length;};

  const regexSearch = new RegExp(wordToFind, "gi");



//  while(node = walk.nextNode())
//  {
//    console.log(node);
  //}
  //return "";
  while(node = walk.nextNode())
  {

    let wordOccurances = (node.textContent.match(regexSearch) || []).length;

    currentString += node.textContent;
    currentStringNodes.push(node);
    occurances += wordOccurances;
    //aba a ba aba aba
    //if inbetween hits possible
    if (currentStringNodes.length > 1 && currentString.length >= wordToFind.length)
    {
      //if inbetween hits
      let inbetweenOccurances = (currentString.match(regexSearch) || []).length;
      //console.log(currentStringNodes);
      //console.log('occ: ' + occurances);
      //console.log('inb: ' +inbetweenOccurances);

      if (inbetweenOccurances > occurances)
      {
        console.log(`border: cString ${currentString} occurances: ${occurances} inbetweenOcc: ${inbetweenOccurances} array:${currentStringNodes.length}`)
        highlightBorderWords(currentStringNodes, regexSearch);
        currentString = node.textContent;
        currentStringNodes = [node];
        occurances =  (node.textContent.match(regexSearch) || []).length;
      }
      //if the current string is longer than the search word without the first node, remove first node
      else if (currentString.length - currentStringNodes[0].textContent.length >= wordToFind.length - 1)
      {
        currentString = currentString.substring(currentStringNodes[0].textContent.length);
        occurances -= (currentStringNodes[0].textContent.match(regexSearch) || []).length;
        currentStringNodes.shift();
      }
    }

    if (node.textContent.match(regexSearch))
    {
      highlightWholeWords(node, regexSearch); //highlights and cuts ALL occurances of the word out of the node. the left node is a cutoff piece
      currentString = node.textContent;

      currentStringNodes = [node];
      occurances = 0;
      console.log(`after highlight: ${node.textContent}`);
    }
  }
  return;
}

function sendSearchContentToBackground()
{
  message = { message:"update_content", tabId: ThisTabId, data: TabSearchValue, state: SearchOpen };
  chrome.runtime.sendMessage(message);
}

function onSearchValueChange(newValue)
{
  TabSearchValue.searchString = newValue;
  if (newValue && newValue.length > 0)
    textNodesUnder(document.body, newValue);
  sendSearchContentToBackground();
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

//chrome.runtime.sendMessage("content-loaded");
console.log("content script loaded")