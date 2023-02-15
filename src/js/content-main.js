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
        `);

   
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
        
        cacheData();
    });

    document.addEventListener("tf-search-changed", function (e)
    {
        cacheData();
    });

    document.addEventListener('keydown', function (e)
    {
        if (e.key == "Escape")
        {
            searchBarMap.forEach(function (_val) { _val.close() });
            cacheData();
        }
    });

    chrome.runtime.onMessage.addListener(
        function (request, sender)
        {
            console.log("processing");
            console.log(request);
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
                        console.log(JSON.stringify(request))
                        NEW_SEARCH_STATE = true;
                        TabSearchData = SearchCollection.load(request.data, request.pinnedOnly);
                        console.log(JSON.stringify(TabSearchData))
                    }

                    if (NEW_SEARCH_STATE || request.forcedUpdate)
                    {
                        console.log("opening");
                        console.log(JSON.stringify(TabSearchData));
                        searchBarMap.forEach(function (_val) { _val.close() });
                        searchBarMap = new Map();

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

    function cacheData()
    {
        if (TabSearchData.isEmpty())
            return;

        let message = { message: "tf-update-state", tabId: ThisTabId, data: TabSearchData };
        chrome.runtime.sendMessage(message);
    }

    chrome.runtime.sendMessage({ message: "tf-content-script-loaded" });
}