import { Search, GetClosePanelsEvent } from './search.js';
import { Root } from './root.js';
import { State } from './state.js';

//Main content script, talks to background script via runtime events, creates new Searches
export function main() {
    const maxSearches = 15;
    var tabId;
    var searchMap = new Map();

    Root.Get().addEventListener(GetClosePanelsEvent().type, (args) => {
        searchMap.delete(args.id);
    });

    document.addEventListener('keydown', (args) => {
        if (args.key == "Escape") {
            searchMap.forEach((search) => {
                if (!search.State.pinned) {
                    search.Close();
                }
            });
        }
    });

    //when script is unloaded, cache contents within background script
    window.addEventListener('unload', () => {
        console.log("unload");
        if (searchMap.size == 0)
            return;
        const pinnedSearches = new Map();
        getStatesMap(searchMap).forEach((state, id) => {
            if (state.pinned)
                pinnedSearches.set(id, state)
        });
        sendMessageToService({
            context: "fm-content-cache",
            tabId: tabId,
            data: serializeMap(pinnedSearches)
        });
    });

    window.addEventListener('visibilitychange', () => {
        if (document.visibilityState == 'visible')
            sendMessageToService({ context: "fm-content-visible" });
    });

    chrome.runtime.onMessage.addListener(
        (request, sender, sendResponse) => {
            tabId = tabId || request.tabId;
            let response = "accepted";

            switch (request.context) {
                case `fm-content-focus-search`:
                    if (searchMap.size > 0) {
                        Search.NextFocus();
                        break;
                    }
                case "fm-content-add-new":
                    if (searchMap.size >= maxSearches)
                        break;
                    const newSearch = new State();

                    newSearch.pinned = Search.Options?.StartPinned || false;
                    newSearch.colorIndex = State.GetNextColor(Array.from(getStatesMap(searchMap).values()));

                    const id = newSearchState(searchMap);
                    searchMap.set(id, new Search(id, newSearch, request.options));
                    break;

                case "fm-content-restart-search":
                    searchMap.forEach((search) => search.Restart())
                    break;

                case "fm-content-update-search":
                    searchMap.forEach((oldSearch) => oldSearch.Close())
                    searchMap = new Map();

                    const loadedMap = deserializeStateMap(request.data);
                    loadedMap?.forEach((state) => {
                        const newId = newSearchState(searchMap);
                        searchMap.set(newId, new Search(newId, state));
                    });
                    break;

                case `fm-content-state-request`:
                    response = serializeMap(getStatesMap(searchMap));
                    break;

                case `fm-content-update-options`:
                    setOptions(request.options, searchMap);
                    break;

                default:
                    console.log("unknown message: " + request.context);
            }
            sendResponse(response);
        }
    );

    sendMessageToService({ context: "fm-content-script-loaded" });

    function getStatesMap(searches) {
        const map = new Map;
        searches.forEach((search, id) => map.set(id, search.State));
        return map;
    }

    function setOptions(options, searches) {
        Search.SetOptions(options, Array.from(searches.values));
    }

    function newSearchState(searches) {
        let id = 0;
        while (searches.has(id))
            id += 1;
        return id;
    }

    function serializeMap(map) {
        return JSON.stringify(Array.from(map.entries()));
    }

    function deserializeStateMap(string) {
        const map = new Map(JSON.parse(string));
        map?.forEach((val, key, map) => map.set(key, State.Load(val)));
        return map;
    }

    function sendMessageToService(message) {
        try {
            chrome.runtime.sendMessage(message);
        }
        catch (error) {
            console.log(`Error ${error.context}: can't reach service worker `)
        }
    }
}