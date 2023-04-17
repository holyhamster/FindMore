import { Messaging } from "./messaging";
import { Options } from "./options";

//Extension service worker, sends and recieves events between content and popup scripts
//Caches content script data between page reloads
//Saves option and searches into storage

var tabCache = new Map<number, any>();
const messaging = new Messaging();

chrome.runtime.onMessage.addListener(
    (runTimeEvent: any, sender: any) => {
        if (runTimeEvent?.context?.includes("fm-content"))
            processContentEvent((runTimeEvent.tabId || sender?.tab?.id), runTimeEvent);

        if (runTimeEvent?.context?.includes("fm-popup"))
            processPopupEvent(runTimeEvent)
    });

//events send by the content script of the page
function processContentEvent(tabId: number, event: any) {
    switch (event.context) {
        //when content script is loaded, send all pinned searches from cache
        //if there's' a new request that didnt have a response from content script, send it again
        case "fm-content-script-loaded":
            Options.TryLoad((option: any) => {
                const previousTabData = tabCache.get(tabId);
                tabCache.delete(tabId);

                if (!option && !previousTabData)
                    return;
                const message = {
                    options: option,
                    data: previousTabData,
                    context: previousTabData ? `fm-content-update-search` : `fm-content-update-options`
                };
                messaging.Send(tabId, message);
                messaging.ResendCached(tabId);
            });
            break;

        case "fm-content-visible":
            Options.TryLoad(
                (option: any) => messaging.Send(tabId, { context: `fm-content-update-options`, options: option }));
            break;

        case "fm-content-cache":
            if (event.data)
                tabCache.set(tabId, event.data);
            break;
    }
}

//events send by popup script
function processPopupEvent(event: any) {

    switch (event.context) {
        case "fm-popup-options-change":
            callOnActiveId((id: number) => messaging.Send(id, { context: `fm-content-update-options`, options: event.options }));
            break;

        case "fm-popup-new-search":
            callOnActiveId((id: number) => messaging.Send(id, { context: "fm-content-add-new" }));
            break;

        //if there's no active window, remove saved data
        case "fm-popup-save-search":
            saveActiveTabIntoStorage();
            break;

        case "fm-popup-load-search":
            loadStorageToActiveTab();
            break;

        //request data from active tab, respond back with a message if active search data exists
        case "fm-popup-current-search-request":
            const respondToPopup = (id?: number, hasData = false) =>
                chrome.runtime.sendMessage({ context: "fm-popup-current-search-answer", id: id, hasData: hasData });
            callOnActiveId((id: number) => {
                messaging.Send(id, { context: "fm-content-state-request" },
                    (data: any) => respondToPopup(id, data && data != "[]"),
                    () => respondToPopup(id));
            },
                () => respondToPopup());
            break;
    }
}

//Hotkey commands defined in manifest.json
chrome.commands.onCommand.addListener((HOTKEY_COMMAND) => {
    switch (HOTKEY_COMMAND) {
        case 'fm-hotkey-new-search':
            callOnActiveId((id) => messaging.Send(id, { context: "fm-content-add-new" }));
            break;
        case 'fm-hotkey-focus-search':
            callOnActiveId((id) => messaging.Send(id, { context: "fm-content-focus-search" }));
            break;
        case 'fm-hotkey-save-search':
            saveActiveTabIntoStorage();
            break;
        case 'fm-hotkey-load-search':
            loadStorageToActiveTab();
            break;
    }
});

//saves the current tab data into storage
//if there's no data or no active tab, clears storage
function saveActiveTabIntoStorage() {
    const removeData = () => chrome.storage.local.remove(["fmSavedSearch"]);
    callOnActiveId(
        (id: number) => {
            messaging.Send(id, { context: "fm-content-state-request" },
                (data: any) => {
                    if (data && data != "[]")
                        chrome.storage.local.set({ "fmSavedSearch": data });
                    else
                        removeData();
                    showSuccessStatus();
                });
        },
        () => {
            removeData();
            showSuccessStatus();
        });
}

function loadStorageToActiveTab() {
    callOnActiveId(
        (id: number) => {
            chrome.storage.local.get("fmSavedSearch", (storage) => {
                const loadedData = storage.fmSavedSearch;
                if (!loadedData)
                    return;

                messaging.Send(id, { context: "fm-content-update-search", data: loadedData });
                showSuccessStatus();
            });
        });
}

//tell content script to restart search of view boudnary changed
chrome.windows.onBoundsChanged.addListener(() =>
    callOnActiveId((id) => messaging.Send(id, { context: `fm-content-restart-search` })));

//Calls back with an id of the active tab, executes onNoActive if none exists
function callOnActiveId(onActiveID: (id: number) => void, onNoActive?: () => void) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = tabs?.[0]?.url;
        if (url && !url.startsWith('chrome://'))
            onActiveID((Number)(tabs[0].id));
        else
            onNoActive?.();
    });
}

//show a small checkmark badge on top of the extension's icon
function showSuccessStatus(duration = 3000) {
    chrome.action.setBadgeText({ text: "\u{2713}" });
    setTimeout(() => chrome.action.setBadgeText({ text: "" }),
        duration
    );
}