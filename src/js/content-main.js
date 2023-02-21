import SearchBar from './modules/searchBar.js';
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
            ThisTabId = request.tabId;

            switch (request.message)
            {
                case "tf-new-search":
                    let id = getNewID();
                    let newSearch = new SearchState("");
                    searchesMap.set(id, newSearch)
                    barsMap.set(id, new SearchBar(id, newSearch, barsMap.size));
                    cacheData();
                    break;

                case "tf-update-search":
                    if (!request.data)
                        return;

                    barsMap.forEach(function (_val) { _val.close() });
                    barsMap = new Map();
                    searchesMap = new Map();

                    let loadedMap = deserializeIntoMap(request.data);
                    loadedMap.forEach(function (_state)
                    {
                        if (request.pinnedOnly && !_state.pinned)
                            return;

                        let newId = getNewID();
                        searchesMap.set(newId, _state);

                        barsMap.set(newId,
                            new SearchBar(newId, _state, barsMap.size));
                    });
                    break;

                default:
                    console.log("uncaught message: " + request.message);
            }
        }
    );

    function reorderBars(_map)
    {
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
        let map = new Map(JSON.parse(_string));
        map.forEach(function (_val, _key, _map)
        {
            _map.set(_key, SearchState.load(_val));
        });
        return map;
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