import { Search, ClosePanelsEvent } from './search/search';
import { RootNode } from './search/rootNode';
import { State } from './search/state';

//Content script thta's loaded into pages
//Talks to background script via runtime events, initiates new Searches

const maxSearches = 15;

 //all searches by their internal IDs
class SearchMap extends Map<number, Search> {
    public getStatesMap(): Map<number, State> {
        const map = new Map<number, State>();
        this.forEach((search: Search, id: number) => map.set(id, search.state));
        return map;
    }
};
var searchMap = new SearchMap(); 

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
                if (request.options)
                    Search.SetOptions(request.options);
                searchMap.forEach((oldSearch) => oldSearch.Close())
                searchMap.clear();

                const loadedMap = deserializeArray(request.data) as State[];
                loadedMap?.forEach((state: State) => {
                    const newId = getNewID(searchMap);
                    searchMap.set(newId, new Search(newId, state));
                });
                break;

            case `fm-content-state-request`:
                response = serializeArray(Array.from(searchMap.getStatesMap().values()));
                break;

            case `fm-content-update-options`:
                Search.SetOptions(request.options);
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
    
    const pinnedSearches = new Map<number, State>();
    searchMap.getStatesMap().forEach((state, id) => {
        if (state.pinned)
            pinnedSearches.set(id, state)
    });
    if (pinnedSearches.size == 0)
        return;
    const message = {
        context: "fm-content-cache",
        tabId: tabId,
        data: serializeArray(Array.from(pinnedSearches.values()))
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

function getNewID(searches: SearchMap) {
    let id = 0;
    while (searches.has(id))
        id += 1;
    return id;
}

function serializeArray(array: any[]) {
    return JSON.stringify(array);
}

function deserializeArray(string: string): State[] {
    const map = Array.from(JSON.parse(string)) as State[];
    for (let i = 0; i < map.length; i++)
        map[i] = State.Load(map[i]);
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