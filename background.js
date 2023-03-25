//Extension service worker, sends and recieves events between content and popup scripts
//Caches content script data between page reloads
//Saves option and searches into storage

var tabCache = new Map();

chrome.runtime.onMessage.addListener((runTimeEvent, sender) => {
    console.log(runTimeEvent.context);
    if (runTimeEvent?.context?.includes("fm-content")) {
        const tabId = runTimeEvent.tabId || sender?.tab?.id;
        processContentEvent(tabId, runTimeEvent);
    }
    if (runTimeEvent?.context?.includes("fm-popup"))
        processPopupEvent(runTimeEvent)
});

//events send by the content script of the page
function processContentEvent(tabId, event) {
    switch (event.context) {
        //when content script is loaded, send all pinned searches from cache
        //if there's' a new request that didnt have a response from content script, send it again
        case "fm-content-script-loaded":
            loadOptions((option) => messageTab(tabId, { context: `fm-content-update-options`, options: option }));
            const previousTabData = tabCache.get(tabId);
            if (previousTabData)
                messageTab(tabId, { context: `fm-content-update-search`, data: previousTabData });
            tabCache.delete(tabId);
            resendCachedMessages(tabId);
            break;

        case "fm-content-visible":
            loadOptions((option) => messageTab(tabId, { context: `fm-content-update-options`, options: option }));
            break;

        case "fm-content-cache":
            if (!event.data)
                return;
            tabCache.set(tabId, event.data);
            break;
    }
}

//events send by popup script
function processPopupEvent(event) {

    switch (event.context) {
        case "fm-popup-options-change":
            callOnActiveId((id) => messageTab(id, { context: `fm-content-update-options`, options: event.options }));
            break;

        case "fm-popup-new-search":
            callOnActiveId((id) => messageTab(id, { context: "fm-content-add-new" }));
            break;

        //if there's no active window, remove saved data
        case "fm-popup-save-search":
            saveActiveTabIntoStorage();
            break;

        case "fm-popup-load-search":
            loadStorageToActiveTab();
            break;

        case "fm-popup-current-search-request":
            const respondToPopup = (id, hasData) =>
                chrome.runtime.sendMessage({ context: "fm-popup-current-search-answer", id: id, hasData: hasData });
            callOnActiveId((id) => {
                messageTab(id, { context: "fm-content-state-request" },
                    (data) => respondToPopup(id, data && data != "[]"),
                    () => respondToPopup(id)
                );
            }, () => respondToPopup());
            break;
    }
}

//Hotkey commands defined in manifest.json
chrome.commands.onCommand.addListener((HOTKEY_COMMAND) => {
    console.log(HOTKEY_COMMAND);
    switch (HOTKEY_COMMAND) {
        case 'fm-hotkey-new-search':
            callOnActiveId((id) => messageTab(id, { context: "fm-content-add-new" }));
            break;
        case 'fm-hotkey-focus-search':
            callOnActiveId((id) => messageTab(id, { context: "fm-content-focus-search" }));
            break;
        case 'fm-hotkey-save-search':
            saveActiveTabIntoStorage();
            break;
        case 'fm-hotkey-load-search':
            loadStorageToActiveTab();
            break;
    }
});

//tell content script to restart search of view boudnary changed
chrome.windows.onBoundsChanged.addListener(() =>
    callOnActiveId((id) => messageTab(id, { context: `fm-content-restart-search` })));

//Calls back with an id of the active tab, executes onNoActive if none exists
function callOnActiveId(onActiveID, onNoActive) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = tabs?.[0]?.url;
        if (url && !url.startsWith('chrome://'))
            onActiveID((Number)(tabs[0].id));
        else
            onNoActive?.call();
    });
}

function loadOptions(onLoadedOptions) {
    chrome.storage.sync.get("fmSavedOptions", (storage) => {
        onLoadedOptions(storage?.fmSavedOptions);
    });
}

//Sends a message to tab's content scripts
//message is cached in case the page hasn't loaded content-main.js yet
//If recieves reponse under reponseTime, calls onSuccess. Otherwise onTimeOut
messageCache = new Map();
const reponseTime = 5000;
async function messageTab(tabId, args, onSuccess, onTimeOut) {
    const message = { tabId: tabId };
    Object.assign(message, args);

    if (!messageCache.get(tabId))
        messageCache.set(tabId, []);
    messageCache.get(tabId).push(message);
    try {
        const response = await Promise.race([
            chrome.tabs.sendMessage(tabId, message),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), reponseTime))
        ]);

        const tabMessages = messageCache.get(tabId);
        if (tabMessages?.includes(message))
            tabMessages.splice(tabMessages.indexOf(message), 1);
        onSuccess?.(response);
    }
    catch (error) {
        if (error.message === "timeout")
            onTimeOut?.();
    }
}

function resendCachedMessages(id) {
    if (!messageCache.has(id))
        return;
    const tabMessages = Array.from(messageCache.get(id));
    messageCache.delete(id);
    tabMessages.forEach((message) => messageTab(id, message));
}

//saves the current tab data into storage
//if there's no data or no active tab, clears storage
function saveActiveTabIntoStorage() {
    const removeData = () => chrome.storage.local.remove(["fmSavedSearch"]);
    callOnActiveId(
        (id) => {
            messageTab(id, { context: "fm-content-state-request" },
                (data) => {
                    if (data && data != "[]")
                        chrome.storage.local.set({ "fmSavedSearch": data });
                    else
                        removeData();
                    showSuccessStatus();
                });
        }, () => {
            removeData();
            showSuccessStatus();
        });
}

function loadStorageToActiveTab() {
    callOnActiveId(
        (id) => {
            chrome.storage.local.get("fmSavedSearch", (storage) => {
                const loadedData = storage.fmSavedSearch;
                if (!loadedData)
                    return;

                messageTab(id, { context: "fm-content-update-search", data: loadedData });
                showSuccessStatus();
            });
        });
}

//show a small checkmark badge on top of the extension's icon
function showSuccessStatus(duration = 3000) {
    chrome.action.setBadgeText({ text: "\u{2713}" });
    setTimeout(() => chrome.action.setBadgeText({ text: "" }),
        duration
    );
}