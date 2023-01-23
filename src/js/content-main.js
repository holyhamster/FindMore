import SearchState from './modules/searchState.js';
import DomSearcher from './domSearcher.js';

export function main() {

  console.log(window.frameElement);
  var ThisTabId;
  var TabSearchData;
  var searchWorkers = [];
  var currentSearch;

  const highlightCSS = new CSSStyleSheet();
  highlightCSS.replaceSync(".TFHighlight { background-color: red; opacity: 0.5; z-index: 147483647; }");

  document.addEventListener('keydown', function(e){
    if (e.key == "Escape")
      if (TabSearchData && TabSearchData.open)
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
                  TabSearchData = new SearchState(request.data);

                }
            }
            else if (!TabSearchData) {
              NEW_SEARCH_STATE = true;
              TabSearchData = new SearchState(request.data)
            }

            if (NEW_SEARCH_STATE || request.forcedUpdate)
            {
              updateBarState(TabSearchData);

              removeHighlight();
              if (currentSearch)
                currentSearch.interrupt();

              if (TabSearchData.open &&
                TabSearchData.searchString != "")
              {
                //getTextRectangles(TabSearchData.searchString);
                currentSearch = new DomSearcher(TabSearchData.searchString, TabSearchData.getRegexpOptions(), false);
              }
              cacheDataToBackground();
            }
            break;


          default:
            console.log("uncaught message: " + request.message);
        }
      }
    );

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
        inputBar.focus();
        inputBar.addEventListener("input", function(e){
          if (_dataRef.searchString == e.target.value)
            return;


          _dataRef.searchString = e.target.value;
          cacheDataToBackground();

          removeHighlight();
          if (currentSearch)
            currentSearch.interrupt();

          if (_dataRef.searchString && _dataRef.searchString.length > 0)
            currentSearch = new DomSearcher(TabSearchData.searchString, TabSearchData.getRegexpOptions(), false);
          //getTextRectangles(_dataRef.searchString);
        });

        bar.appendChild(inputBar);
        bar.style.position = "fixed";
        bar.style.top = "10px";
        bar.style.right = "10px";
        bar.style.backgroundColor = "white";
        bar.style.padding = "10px";
        bar.style.zIndex = 147483647;
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

  function removeHighlight () {
    let highlights = document.querySelectorAll('.TFContainer');
    for (let i = 0; i < highlights.length; i++) {
      highlights[i].remove();
    }
  }

  function cacheDataToBackground()
  {
    let message = { message:"update_content", tabId: ThisTabId, data: TabSearchData};
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

  //chrome.runtime.sendMessage("content-loaded");
  console.log("content script loaded")
}