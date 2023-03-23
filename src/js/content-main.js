import { Search, GetClosePanelsEvent, GetStateChangeEvent } from './search.js';
import { Root } from './root.js';
import { State } from './state.js';

//Main content script, talks to background script via runtime events, creates new Searches
export function main() {
    var tabId;
    var panelsMap = new Map();

    Root.Get().addEventListener(GetClosePanelsEvent().type, (args) => {
        if (panelsMap.has(args.id))
            panelsMap.delete(args.id);
        sendToCaching(panelsMap);
    });

    Root.Get().addEventListener(GetStateChangeEvent().type, () => sendToCaching(panelsMap));

    document.addEventListener('keydown', (args) => {
        if (args.key == "Escape") {
            panelsMap.forEach((panel) => {
                if (!panel.State.pinned) {
                    panel.Close();
                }
            });
            sendToCaching(panelsMap);
        }
    });

    chrome.runtime.onMessage.addListener(
        (request, sender, sendResponse) => {
            sendResponse("success");

            tabId = tabId || request.tabId;
            const options = request.options;
            if (options)
                setOptions(options, panelsMap);

            switch (request.context) {
                case "fm-content-add-new":
                    const newSearch = new State();
                    newSearch.pinned = options?.StartPinned || false;
                    newSearch.colorIndex = State.GetNextColor(Array.from(getStatesMap(panelsMap).values()));

                    const id = getNewID(panelsMap);
                    panelsMap.set(id, new Search(id, newSearch, request.options));

                    sendToCaching(panelsMap);
                    break;

                case "fm-content-update-search":
                    if (!request.data)
                        return;

                    panelsMap.forEach((oldPanel) => oldPanel.Close())
                    panelsMap = new Map();

                    const loadedMap = deserializeIntoMap(request.data);
                    loadedMap?.forEach((state) => {
                        if (request.pinnedOnly && !state.pinned)
                            return;

                        const newId = getNewID();
                        panelsMap.set(newId, new Search(newId, state));
                    });
                    break;
                case `fm-content-update-options`:
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

    function setOptions(options, panels) {
        Search.SetOptions(options, Array.from(panels.values));
    }

    function getNewID(panels) {
        let id = 0;
        while (panels.has(id))
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

    function sendToCaching(panelsMap) {
        const message = { message: "fm-content-cache-state", tabId: tabId };
        const states = getStatesMap(panelsMap)
        if (states.size > 0)
            message.data = serializeMap(states);
        chrome.runtime.sendMessage(message);
    }

    chrome.runtime.sendMessage({ message: "fm-content-script-loaded" });
}