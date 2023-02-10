import SearchCollection from './searchCollection.js';
import SearchBar from './searchBar.js';

export function main()
{

    var ThisTabId;
    var TabSearchData = new SearchCollection();
    var searchBarMap = new Map();
    var lastID = 0;

    const highlightCSS = new CSSStyleSheet();
    highlightCSS.replaceSync(
        `.TFHighlight { position: absolute; }
        .TFContainer { position: absolute; }
        .TFContainerRelative { position: relative; }
        .TFSearchBar { position:fixed; opacity: .8; }`);

    if (!document.adoptedStyleSheets.includes(highlightCSS))
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, highlightCSS];

    document.addEventListener("TF-bar-closed", function (e)
    {
        if (searchBarMap.get(e.id))
        {
            TabSearchData.delete(searchBarMap.searchState);
            searchBarMap.delete(e.id);
        }

        reorderBars(searchBarMap);
        
        cacheDataToBackground();
    });

    document.addEventListener("TF-search-changed", function (e)
    {
        cacheDataToBackground();
    });

    document.addEventListener('keydown', function (e)
    {
        if (e.key == "Escape")
            searchBarMap.forEach(function (_val) { _val.close() });

            cacheDataToBackground();
    });

    chrome.runtime.onMessage.addListener(
        function (request, sender)
        {
            if (!ThisTabId)
                ThisTabId = request.tabId;
            switch (request.message)
            {
                case "new_search":
                    let id = getNewID();
                    let bar = new SearchBar(id, TabSearchData.addNewState(), searchBarMap.size);
                    searchBarMap.set(id, bar);
                    reorderBars(searchBarMap);
                    break;

                case "update_search":
                    console.log("update trigger");
                    let NEW_SEARCH_STATE = false;
                    if (request.data &&
                        !TabSearchData.isEquals(request.data))
                    {
                        NEW_SEARCH_STATE = true;
                        TabSearchData = new SearchCollection(request.data);
                    }

                    if (NEW_SEARCH_STATE || request.forcedUpdate)
                    {
                        searchBarMap.forEach(function (_val) { _val.close() });

                        for (let i = 0; i < TabSearchData.searches.length; i++)
                        {
                            let id = getNewID();
                            let bar = new SearchBar(id, TabSearchData.searches[i], i);
                            searchBarMap.set(id, bar);
                        }
                        reorderBars(searchBarMap);
                    }
                    break;

                default:
                    console.log("uncaught message: " + request.message);
            }
        }
    );

    function reorderBars(_map)
    {
        let iter = _map.keys();
        let order = 0, iKey = 0;
        while (iKey = iter.next().value)
        {
            _map.get(iKey).setPosition(order);
            order += 1;
        }
    }

    function getNewID()
    {
        lastID += 1;
        return lastID;
    }

    function cacheDataToBackground()
    {
        let message = { message: "update_content", tabId: ThisTabId, data: TabSearchData };
        chrome.runtime.sendMessage(message);
    }

    //chrome.runtime.sendMessage("content-loaded");
    console.log("content script loaded")
}