import SearchBar from './modules/searchBar.js';
import SearchState from './modules/searchState.js';

export function main()
{
    var tabId;
    var searchesMap = new Map();    //key is ID (integer)
    var barsMap = new Map();    //key is ID (integer)
    var options = new Object();

    //#region document events
    document.addEventListener("tf-bar-closed", function (_args)
    {
        if (barsMap.get(_args.id))
        {
            searchesMap.delete(_args.id);
            barsMap.delete(_args.id);
        }

        cacheData();
    });

    document.addEventListener("tf-search-changed", function ()
    {
        cacheData();
    });

    document.addEventListener('keydown', function (_args)
    {
        if (_args.key == "Escape")
        {
            searchesMap.forEach(function (_val, _key)
            {
                if (!_val.pinned)
                {
                    barsMap.get(_key).close();
                    barsMap.delete(_key);
                    searchesMap.delete(_key);
                }
            });
            cacheData();
        }
    });
    //#endregion

    chrome.runtime.onMessage.addListener(
        function (request, sender)
        {
            tabId = request.tabId;

            switch (request.message)
            {
                case "tf-options-update":
                    if (request.options)
                        loadOptions(request.options);
                    break

                case "tf-new-search":
                    if (request.options)
                        loadOptions(request.options);

                    const id = getNewID();
                    const newSearch = new SearchState("");
                    newSearch.pinned = options.startPinned;

                    searchesMap.set(id, newSearch)
                    barsMap.set(id, new SearchBar(id, newSearch, barsMap.size));
                    cacheData();
                    break;

                case "tf-update-search":
                    if (request.options)
                        loadOptions(request.options);

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
                            new SearchBar(newId, _state));
                    });
                    break;

                default:
                    console.log("uncaught message: " + request.message);
            }
        }
    );

    function loadOptions(_options)
    {
        console.log(_options);
        SearchBar.getShadowRoot().setStyleFromOptions(_options);
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
            message: "tf-content-update-state", tabId: tabId,
            data: serializeMap(searchesMap)
        };
        chrome.runtime.sendMessage(message);
    }

    chrome.runtime.sendMessage({ message: "tf-content-script-loaded" });
}