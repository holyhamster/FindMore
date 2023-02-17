import SearchBar from './searchBar.js';
import SearchState from './modules/searchState.js';

export function main()
{

    var ThisTabId;
    var searchesMap = new Map();
    var barsMap = new Map();

   
    document.addEventListener("tf-bar-closed", function (e)
    {
        
        if (barsMap.get(e.id))
        {
            searchesMap.delete(e.id);
            barsMap.delete(e.id);
        }

        reorderBars(barsMap);
        
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
            barsMap.forEach(function (_val) { _val.close() });
            barsMap = new Map();
            searchesMap = new Map();
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
                    let newSearch = new SearchState("");
                    let bar = new SearchBar(id, newSearch, barsMap.size);
                    searchesMap.set(id, newSearch)
                    barsMap.set(id, bar);
                    cacheData();
                    break;

                case "update_search":
                    if (!request.data)
                        return;
                    console.log("updating");
                    console.log(request.data);
                    //if (!request.forcedUpdate)
                    //add same-ness check

                    barsMap.forEach(function (_val) { _val.close() });
                    barsMap = new Map();
                    let loadedMap = deserializeIntoMap(request.data);

                    loadedMap.forEach(function (_val, _key)
                    {
                        if (request.pinnedOnly && !_val.pinned)
                        {
                            return;
                        }
                        let newId = getNewID();
                        searchesMap.set(newId, _val);
                        let newSearchBar = new SearchBar(newId, _val, barsMap.size);
                        console.log(barsMap.size);
                        barsMap.set(newId, newSearchBar);
                    });
                    break;

                default:
                    console.log("uncaught message: " + request.message);
            }
        }
    );

    function reorderBars(_map)
    {
        let iter = _map.keys();
        let order = 0;
        barsMap.forEach(function (_val, _key)
        {
            _val.setPosition(order);
            order += 1;
        });
    }

    function getNewID()
    {
        let id = 0;
        while (searchesMap.has(id))
            id += 1;

        return id;
    }
    function serializeMap(_map)
    {
        return JSON.stringify(Array.from(_map.entries()));
    }
    function deserializeIntoMap(_string)
    {
        return new Map(JSON.parse(_string));
    }
    function cacheData()
    {
        let message = {
            message: "tf-update-state", tabId: ThisTabId,
            data: serializeMap(searchesMap)
        };
        chrome.runtime.sendMessage(message);
    }

    chrome.runtime.sendMessage({ message: "tf-content-script-loaded" });
}