import SearchPanel from './searchPanel.js';
import SearchState from './searchState.js';

export function main()
{
    var tabId;
    var searchesMap = new Map();    //key -- integer bar ID
    var barsMap = new Map();    //key -- integer bar ID

    //#region document events
    document.addEventListener("fm-bar-closed", function (_args)
    {
        if (barsMap.get(_args.id))
        {
            searchesMap.delete(_args.id);
            barsMap.delete(_args.id);
        }

        cacheData();
    });

    document.addEventListener("fm-search-changed", function ()
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

    chrome.runtime.onMessage.addListener(
        (_request, _sender, _sendResponse) =>
        {
            tabId = tabId || _request.tabId;
            if (_request.options)
                loadOptions(_request.options);

            switch (_request.message)
            {
                case "fm-new-search":
                    const id = getNewID();
                    const newSearch = new SearchState("");
                    newSearch.pinned = _request.options?.startPinned || false;

                    searchesMap.set(id, newSearch)
                    barsMap.set(id, new SearchPanel(id, newSearch, barsMap.size));
                    cacheData();
                    _sendResponse({});
                    break;

                case "fm-update-search":
                    if (!_request.data)
                        return;
                    barsMap.forEach(function (_val) { _val.close() });
                    barsMap = new Map();
                    searchesMap = new Map();

                    const loadedMap = deserializeIntoMap(_request.data);
                    loadedMap?.forEach(function (_state)
                    {
                        if (_request.pinnedOnly && !_state.pinned)
                            return;

                        const newId = getNewID();
                        searchesMap.set(newId, _state);

                        barsMap.set(newId,
                            new SearchPanel(newId, _state));
                    });
                    break;

                default:
                    console.log("uncaught message: " + _request.message);
            }
        }
    );

    function loadOptions(_options)
    {
        SearchPanel.getShadowRoot().setStyleFromOptions(_options);
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
        const map = new Map(JSON.parse(_string));
        map?.forEach(function (_val, _key, _map)
        {
            _map.set(_key, SearchState.load(_val));
        });
        return map;
    }
    function cacheData()
    {
        const message = { message: "fm-content-update-state", tabId: tabId };

        if (searchesMap.size > 0)
            message.data = serializeMap(searchesMap);
        chrome.runtime.sendMessage(message);
    }
    

    chrome.runtime.sendMessage({ message: "fm-content-script-loaded" });

}