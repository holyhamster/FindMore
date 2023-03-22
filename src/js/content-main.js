import { Search, GetClosePanelsEvent, GetStateChangeEvent } from './search.js';
import { Root } from './root.js';
import { State } from './state.js';

//passes events between background and the document scripts
//creates Seaches
export function main() {
    var tabId;
    var panelsMap = new Map();

    Root.Get().addEventListener(GetClosePanelsEvent().type, (args) => {
        if (panelsMap.has(args.id))
            panelsMap.delete(args.id);
        cacheData(panelsMap);
    });

    Root.Get().addEventListener(GetStateChangeEvent().type, () => {
        cacheData(panelsMap);
    });

    document.addEventListener('keydown', (_args) => {
        if (_args.key == "Escape") {
            panelsMap.forEach((panel) => {
                if (!panel.State.pinned) {
                    panel.Close();
                }
            });
            cacheData(panelsMap);
        }
    });

    chrome.runtime.onMessage.addListener(
        (request, sender, sendResponse) => {
            tabId = tabId || request.tabId;

            const options = request.options;
            if (options)
                setOptions(options);

            switch (request.message) {
                case "fm-new-search":
                    
                    const newSearch = new State();
                    newSearch.pinned = options?.StartPinned || false;
                    newSearch.colorIndex = State.GetNextColor(Array.from(getStatesMap(panelsMap).values()));

                    const id = getNewID();
                    panelsMap.set(id, new Search(id, newSearch, request.options));
                    cacheData(panelsMap);
                    sendResponse({});
                    break;

                case "fm-update-search":
                    if (!request.data)
                        return;
                    panelsMap.forEach((oldPanel, id) => oldPanel.Close())
                    panelsMap = new Map();

                    const loadedMap = deserializeIntoMap(request.data);
                    loadedMap?.forEach((state) => {
                        if (request.pinnedOnly && !state.pinned)
                            return;

                        const newId = getNewID();

                        panelsMap.set(newId,
                            new Search(newId, state));
                    });
                    break;

                default:
                    console.log("uncaught message: " + request.message);
            }
        }
    );

    function getStatesMap(panels) {
        const map = new Map;
        panels.forEach((panel, id) => map.set(id, panel.State));
        return map;
    }

    function setOptions(options) {
        Search.SetOptions(options, Array.from(panelsMap.values));
    }

    function getNewID() {
        let id = 0;
        while (panelsMap.has(id))
            id += 1;
        return id;
    }

    function serializeMap(map) {
        return JSON.stringify(Array.from(map.entries()));
    }

    function deserializeIntoMap(string) {
        const map = new Map(JSON.parse(string));
        map?.forEach((val, key, map) => {
            map.set(key, State.Load(val));
        });
        return map;
    }

    function cacheData(panelsMap) {
        const message = { message: "fm-content-update-state", tabId: tabId };
        const states = getStatesMap(panelsMap)
        if (states.size > 0)
            message.data = serializeMap(states);
        chrome.runtime.sendMessage(message);
    }

    chrome.runtime.sendMessage({ message: "fm-content-script-loaded" });
}