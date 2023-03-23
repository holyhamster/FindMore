import { Search, GetClosePanelsEvent, GetStateChangeEvent } from './search.js';
import { Root } from './root.js';
import { State } from './state.js';

//Main content script, talks to background script via runtime events, creates new Searches
export function main() {
    const maxSearches = 15;
    var tabId;
    var searchMap = new Map();

    Root.Get().addEventListener(GetClosePanelsEvent().type, (args) => {
        if (searchMap.has(args.id))
            searchMap.delete(args.id);
        sendToCaching(searchMap);
    });

    Root.Get().addEventListener(GetStateChangeEvent().type, () => sendToCaching(searchMap));

    document.addEventListener('keydown', (args) => {
        if (args.key == "Escape") {
            searchMap.forEach((search) => {
                if (!search.State.pinned) {
                    search.Close();
                }
            });
            sendToCaching(searchMap);
        }
    });

    chrome.runtime.onMessage.addListener(
        (request, sender, sendResponse) => {
            sendResponse("success");

            tabId = tabId || request.tabId;
            const options = request.options;
            if (options)
                setOptions(options, searchMap);

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
                    newSearch.pinned = options?.StartPinned || false;
                    newSearch.colorIndex = State.GetNextColor(Array.from(getStatesMap(searchMap).values()));

                    const id = getNewID(searchMap);
                    searchMap.set(id, new Search(id, newSearch, request.options));

                    sendToCaching(searchMap);
                    break;

                case "fm-content-update-search":
                    if (!request.data)
                        return;

                    searchMap.forEach((oldSearch) => oldSearch.Close())
                    searchMap = new Map();

                    const loadedMap = deserializeIntoMap(request.data);
                    loadedMap?.forEach((state) => {
                        if (request.pinnedOnly && !state.pinned)
                            return;

                        const newId = getNewID(searchMap);
                        searchMap.set(newId, new Search(newId, state));
                    });
                    break;
                case `fm-content-update-options`:
                    break;
                default:
                    console.log("uncaught message: " + request.message);
            }
        }
    );

    function getStatesMap(searches) {
        const map = new Map;
        searches.forEach((search, id) => map.set(id, search.State));
        return map;
    }

    function setOptions(options, searches) {
        Search.SetOptions(options, Array.from(searches.values));
    }

    function getNewID(searches) {
        let id = 0;
        while (searches.has(id))
            id += 1;
        return id;
    }

    function serializeMap(map) {
        return JSON.stringify(Array.from(map.entries()));
    }

    function deserializeIntoMap(string) {
        const map = new Map(JSON.parse(string));
        map?.forEach((val, key, map) => map.set(key, State.Load(val)));
        return map;
    }

    function sendToCaching(searchMap) {
        const message = { message: "fm-content-cache-state", tabId: tabId };
        const states = getStatesMap(searchMap)
        if (states.size > 0)
            message.data = serializeMap(states);
        chrome.runtime.sendMessage(message);
    }

    chrome.runtime.sendMessage({ message: "fm-content-script-loaded" });
}