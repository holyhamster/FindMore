

var options;
chrome.storage.sync.get("fmSavedOptions", (storage) => {
    if (storage.fmSavedOptions)
        options = storage.fmSavedOptions;
});

var tabsData = new Map();
chrome.runtime.onMessage.addListener((RUNTIME_EVENT, sender) => {
    const tabId = RUNTIME_EVENT.tabId || sender?.tab?.id;
    const data = RUNTIME_EVENT.data;

    switch (RUNTIME_EVENT.message) {
        case "fm-popup-options-change":
            {
                if (!RUNTIME_EVENT.options)
                    return;

                options = RUNTIME_EVENT.options;

                tabsData.forEach((data, id) => {
                    sendDataToPage(id);
                });
            }
            break;

        case "fm-popup-new-search":
            requestNewSearchOnActiveWindow();
            break;

        case "fm-popup-save-search":
            getActiveWindowID(
                (id) => SaveWindowToStorage(id),
                () => chrome.storage.local.remove(["fmSavedSearch"]));
            break;

        case "fm-popup-load-search":
            getActiveWindowID((id) => loadStorageToWindow(id));
            break;

        case "fm-popup-current-search-request":
            const message = { message: "fm-popup-current-search-answer", data: false };
            getActiveWindowID((id) => {
                message.id = id;
                message.data = tabsData.has(id);
                chrome.runtime.sendMessage(message);
            }, () => {
                chrome.runtime.sendMessage(message);
            });
            break;

        case "fm-content-update-state":
            if (data)
                tabsData.set(tabId, data);
            else
                tabsData.delete(tabId)
            break;

        case "fm-content-script-loaded":
            const previousTabData = tabsData.get(tabId);
            if (previousTabData)
                sendDataToPage(tabId, { data: previousTabData, pinnedOnly: true });

            if (quedNewPanels.includes(tabId)) {
                chrome.tabs.sendMessage(tabId, {
                    message: "fm-new-search",
                    tabId: tabId,
                    options: options
                });
                quedNewPanels.splice(quedNewPanels.indexOf(tabId), 1);
            }
            break;
    }
});

chrome.commands.onCommand.addListener((HOTKEY_COMMAND) => {
    switch (HOTKEY_COMMAND) {
        case 'fm-hotkey-new-search':
            requestNewSearchOnActiveWindow();
            break;
        case 'fm-hotkey-save-search':
            getActiveWindowID((id) => SaveWindowToStorage(id), () => chrome.storage.local.remove(["fmSavedSearch"]));
            break;
        case 'fm-hotkey-load-search':
            getActiveWindowID((id) => loadStorageToWindow(id));
            break;
    }
});

chrome.windows.onBoundsChanged.addListener(() => {
    tabsData.forEach((data, id) => {
        sendDataToPage(id, { data: data, forcedUpdate: true });
    });
});

function getActiveWindowID(onActiveID, onNoActive) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = tabs ? tabs[0]?.url : null;
        if (url && !url.startsWith('chrome://'))
            onActiveID((Number)(tabs[0].id));
        else
            onNoActive?.call();
    });
}

function sendDataToPage(tabId, args) {
    const message = {
        message: "fm-update-search",
        tabId: tabId,
        options: options
    };
    Object.assign(message, args);
    console.log(message);
    chrome.tabs.sendMessage(tabId, message);
}

function SaveWindowToStorage(id) {
    if (tabsData.has(id)) {
        chrome.storage.local.set({ "fmSavedSearch": tabsData.get(id) });
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

        tabsData.set(id, loadedData);
        sendDataToPage(id, { data:loadedData, forcedUpdate: true});
        showSuccessStatus();
    });
}

var quedNewPanels = [];
function requestNewSearchOnActiveWindow() {
    getActiveWindowID((id) => {
        chrome.tabs.sendMessage(id, {
            message: "fm-new-search",
            tabId: id,
            options: options
        },
            (response) => {
                const NO_RESPONSE_FROM_CONTENT_SCRIPT = new Boolean(chrome.runtime.lastError);
                if (NO_RESPONSE_FROM_CONTENT_SCRIPT && !quedNewPanels.includes(id))
                    quedNewPanels.push(id);
            }
        );
    });
}

function showSuccessStatus(_time = 3000) {
    chrome.action.setBadgeText({ text: "\u{2713}" });

    setTimeout(() => chrome.action.setBadgeText({ text: "" }),
        _time
    );
}