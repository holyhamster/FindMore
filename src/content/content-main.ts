import { Search, ClosePanelsEvent } from './search/search';
import { RootNode } from './search/rootNode';
import { State } from './search/state';

//Content script loaded after page is loaded
//Talks to background script via runtime events, creates new Searches
const maxSearches = 15;

class SearchMap extends Map<number, Search> {
    public getStatesMap(): Map<number, State> {
        const map = new Map<number, State>();
        this.forEach((search: Search, id: number) => map.set(id, search.state));
        return map;
    }
};
var searchMap = new SearchMap();  //all searches by their IDs

//process events from service worker
var tabId: number;
chrome.runtime.onMessage.addListener(
    (request: any, sender: any, sendResponse: (response: any) => void) => {
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
                newSearch.colorIndex = State.GetNextColor(Array.from(searchMap.getStatesMap().values()));

                const id = getNewID(searchMap);
                searchMap.set(id, new Search(id, newSearch, request.options));
                break;

            case "fm-content-restart-search":
                searchMap.forEach((search) => search.Restart())
                break;

            case "fm-content-update-search":
                searchMap.forEach((oldSearch) => oldSearch.Close())
                searchMap.clear();

                const loadedMap = deserializeStateMap(request.data) as Map<number, State>;
                loadedMap?.forEach((state: State) => {
                    const newId = getNewID(searchMap);
                    searchMap.set(newId, new Search(newId, state));
                });
                break;

            case `fm-content-state-request`:
                response = serializeMap(searchMap.getStatesMap());
                break;

            case `fm-content-update-options`:
                setOptions(request.options);
                break;

            default:
                console.log("unknown message: " + request.context);
        }
        sendResponse(response);
    }
);

//remove search from a map if its panel is closed
RootNode.Get().addEventListener(ClosePanelsEvent.type, (args: any) => searchMap.delete(args.id));

//close all unpinned searches when escape is pressed
document.addEventListener('keydown', (args: any) => {
    if (args.key == "Escape") {
        searchMap.forEach((search) => {
            if (!search.state.pinned)
                search.Close();
        });
    }
});

//send any pinned searches to service worker when the window is unloaded
window.addEventListener('unload', () => {
    if (searchMap.size == 0)
        return;
    const pinnedSearches = new Map<number, State>();
    searchMap.getStatesMap().forEach((state, id) => {
        if (state.pinned)
            pinnedSearches.set(id, state)
    });
    const message = {
        context: "fm-content-cache",
        tabId: tabId,
        data: serializeMap(pinnedSearches)
    };
    sendMessageToService(message);
});

//signal to service worker when the window is visible
window.addEventListener('visibilitychange', () => {
    if (document.visibilityState == 'visible')
        sendMessageToService({ context: "fm-content-visible" });
});

//signal to service worker that script is loaded in a page
sendMessageToService({ context: "fm-content-script-loaded" });

function setOptions(options: any) {
    Search.SetOptions(options);
}

function getNewID(searches: SearchMap) {
    let id = 0;
    while (searches.has(id))
        id += 1;
    return id;
}

function serializeMap(map: Map<any, any>) {
    return JSON.stringify(Array.from(map.entries()));
}

function deserializeStateMap(string: string): Map<number, State> {
    const map = new Map<number, State>(JSON.parse(string));
    map?.forEach((val, key, map) => map.set(key, State.Load(val)));
    return map;
}

function sendMessageToService(message: any) {
    try {
        chrome.runtime.sendMessage(message);
    }
    catch (error: any) {
        console.log(`Error ${error.context}: can't reach service worker `)
    }
}