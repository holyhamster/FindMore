import { Search, GetClosePanelsEvent, GetStateChangeEvent } from './search.js';
import { Shadowroot } from './shadowroot.js';
import State from './state.js';

export function main() {
    var tabId;
    var panels = new Map();    //key -- integer bar ID

    //#region document events
    Shadowroot.Get().addEventListener(GetClosePanelsEvent().type, (args) => {
        if (panels.has(args.id))
            panels.delete(args.id);
        cacheData(panels);
    });

    Shadowroot.Get().addEventListener(GetStateChangeEvent().type, () => {
        cacheData(panels);
    });

    document.addEventListener('keydown', (_args) => {
        if (_args.key == "Escape") {
            panels.forEach(function (panel, id) {
                if (!panel.state.pinned) {
                    panel.Close();
                }
            });
            cacheData(panels);
        }
    });

    chrome.runtime.onMessage.addListener(
        (request, sender, sendResponse) => {
            tabId = tabId || request.tabId;
            if (request.options)
                setOptions(request.options);

            switch (request.message) {
                case "fm-new-search":
                    const id = getNewID();
                    const newSearch = new State("");
                    newSearch.pinned = request.options?.startPinned || false;

                    panels.set(id, new Search(id, newSearch, request.options));
                    cacheData(panels);
                    sendResponse({});
                    break;

                case "fm-update-search":
                    if (!request.data)
                        return;
                    panels.forEach((bar, id) => bar.Close(id))
                    //barsMap.forEach(function (_val) { _val.close() });
                    panels = new Map();

                    const loadedMap = deserializeIntoMap(request.data);
                    loadedMap?.forEach(function (_state) {
                        if (request.pinnedOnly && !_state.pinned)
                            return;

                        const newId = getNewID();

                        panels.set(newId,
                            new Search(newId, _state));
                    });
                    break;

                default:
                    console.log("uncaught message: " + request.message);
            }
        }
    );

    function getStatesMap(panels) {
        const map = new Map;
        panels.forEach((panel, id) => map.set(id, panel.state));
        return map;
    }

    function setOptions(options) {
        Search.SetOptions(options, Array.from(panels.values));
    }

    function getNewID() {
        let id = 0;
        while (panels.has(id))
            id += 1;
        return id;
    }

    function serializeMap(_map) {
        return JSON.stringify(Array.from(_map.entries()));
    }

    function deserializeIntoMap(_string) {
        const map = new Map(JSON.parse(_string));
        map?.forEach((_val, _key, _map) => {
            _map.set(_key, State.load(_val));
        });
        return map;
    }

    function cacheData(barsMap) {
        const message = { message: "fm-content-update-state", tabId: tabId };
        const states = getStatesMap(barsMap)
        if (states.size > 0)
            message.data = serializeMap(states);
        chrome.runtime.sendMessage(message);
    }

    chrome.runtime.sendMessage({ message: "fm-content-script-loaded" });
}