//Extension daemon running on the background
//Sends and recieves events between content and popup scripts, keeps a cached copy of all searches

var options;
chrome.storage.sync.get("fmSavedOptions", (storage) => {
    options = storage?.fmSavedOptions;
});

var tabSearches = new Map();
//chrome.runtime events are used to communicate with content script and with the popup script
chrome.runtime.onMessage.addListener((runTimeEvent, sender) => {
    const tabId = runTimeEvent.tabId || sender?.tab?.id;

    switch (runTimeEvent.message) {
        case "fm-content-cache-state":
            if (runTimeEvent.data)
                tabSearches.set(tabId, runTimeEvent.data);
            else
                tabSearches.delete(tabId)
            break;
        //when content script is loaded, send all pinned searches from cache
        //if there's' a new request that didnt have a response from content script, send it again
        case "fm-content-script-loaded":
            const previousTabData = tabSearches.get(tabId);
            if (previousTabData)
                messageTab(tabId, { context: `fm-content-update-search`, data: previousTabData, pinnedOnly: true });

            if (newSearchRequests.includes(tabId)) {
                requestNewSearchOnActiveWindow();
                newSearchRequests.splice(newSearchRequests.indexOf(tabId), 1);
            }
            break;
        //background script <-> popup script
        case "fm-popup-options-change":
            {
                options = runTimeEvent.options;
                tabSearches.forEach((data, id) => messageTab(id, { context: `fm-content-update-options` }));
            }
            break;

        case "fm-popup-new-search":
            requestNewSearchOnActiveWindow();
            break;

        //if there's no active window, remove saved data
        case "fm-popup-save-search":
            callOnActiveId(
                (id) => saveWindowToStorage(id),
                () => chrome.storage.local.remove(["fmSavedSearch"]));
            break;

        case "fm-popup-load-search":
            callOnActiveId((id) => loadStorageToWindow(id));
            break;

        case "fm-popup-current-search-request":
            const message = { message: "fm-popup-current-search-answer" };
            callOnActiveId((id) => {
                message.id = id;
                message.data = tabSearches.has(id);
                chrome.runtime.sendMessage(message);
            }, () => chrome.runtime.sendMessage(message));
            break;
    }
});

//Hotkey commands defined in manifest.json
chrome.commands.onCommand.addListener((HOTKEY_COMMAND) => {
    switch (HOTKEY_COMMAND) {
        case 'fm-hotkey-new-search':
            requestNewSearchOnActiveWindow();
            break;
        case 'fm-hotkey-focus-search':
            callOnActiveId((id) => messageTab(id, {context: "fm-content-focus-search"}));
            break;
        case 'fm-hotkey-save-search':
            callOnActiveId((id) => saveWindowToStorage(id), () => chrome.storage.local.remove(["fmSavedSearch"]));
            break;
        case 'fm-hotkey-load-search':
            callOnActiveId((id) => loadStorageToWindow(id));
            break;
    }
});

//call for a forced redraw when window boundary changes
chrome.windows.onBoundsChanged.addListener(() => 
    tabSearches.forEach((data, id) =>
        messageTab(id, { context: `fm-content-update-search`, data: data, forcedUpdate: true }))
);

//Callbacks with an id of the active tab, executes onNoActive if none exists
function callOnActiveId(onActiveID, onNoActive) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = tabs?.[0]?.url;
        if (url && !url.startsWith('chrome://'))
            onActiveID((Number)(tabs[0].id));
        else
            onNoActive?.call();
    });
}

const reponseTime = 5000;
//Sends a message to tab's content scripts
//If recieves reponse under reponseTime, calls onSuccess. Otherwise, onTimeOut
async function messageTab(tabId, args, onSuccess, onTimeOut) {
    const message = {
        tabId: tabId,
        options: options
    };
    Object.assign(message, args);

    try {
        const response = await Promise.race([
            chrome.tabs.sendMessage(tabId, message),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), reponseTime))
        ]);

        if (response === 'success')
            onSuccess?.();
    }
    catch (error) {
        if (error.message === "timeout")
            onTimeOut?.();
    }
}

function saveWindowToStorage(id) {
    if (tabSearches.has(id)) {
        chrome.storage.local.set({ "fmSavedSearch": tabSearches.get(id) });
    }
    else
        chrome.storage.local.remove(["fmSavedSearch"])
    showSuccessStatus();
}

function loadStorageToWindow(id) {
    chrome.storage.local.get("fmSavedSearch", (storage) => {
        const loadedData = storage.fmSavedSearch;
        if (!loadedData)
            return;

        tabSearches.set(id, loadedData);
        messageTab(id, { context: "fm-content-update-search", data: loadedData, forcedUpdate: true });
        showSuccessStatus();
    });
}

var newSearchRequests = [];
function requestNewSearchOnActiveWindow() {
    callOnActiveId((id) => {
        if (!newSearchRequests.includes(id))
            newSearchRequests.push(id);
        const onResponse = () => newSearchRequests.splice(newSearchRequests.indexOf(id), 1);
        messageTab(id, { context: "fm-content-add-new" }, onResponse);
    });
}

//show a small checkmark badge on top of the extension's icon'
function showSuccessStatus(duration = 3000) {
    chrome.action.setBadgeText({ text: "\u{2713}" });
    setTimeout(() => chrome.action.setBadgeText({ text: "" }),
        duration
    );
}