var tabsData = new Map();
var options;
loadOptions();
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
                    sendSearchData(id);
                });
            }
            break;

        case "fm-popup-new-search":
            requestNewSearchOnActiveWindow();
            break;

        case "fm-popup-save-search":
            savePanelsToMemory();
            break;

        case "fm-popup-load-search":
            loadPanelsToActive();
            break;

        case "fm-popup-current-search-request":
            const message = { message: "fm-popup-current-search-answer", data: false };
            obtainActiveID((id) => {
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
                sendSearchData(tabId, { data: previousTabData, pinnedOnly: true });

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
            savePanelsToMemory();
            break;
        case 'fm-hotkey-load-search':
            loadPanelsToActive();
            break;
    }
});

chrome.windows.onBoundsChanged.addListener(() => {
    tabsData.forEach((data, id) => {
        sendSearchData(id, { data: data, forcedUpdate: true });
    });
});

function obtainActiveID(onActiveID, onNoActive) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = tabs ? tabs[0]?.url : null;
        if (url && !url.startsWith('chrome://'))
            onActiveID((Number)(tabs[0].id));
        else
            onNoActive?.call();
    });
}

function sendSearchData(tabId, args) {
    const message = {
        message: "fm-update-search",
        tabId: tabId,
        options: options
    };
    Object.assign(message, args);
    console.log(message);
    chrome.tabs.sendMessage(tabId, message);
}

function loadOptions() {
    chrome.storage.sync.get("fmSavedOptions", (storage) => {
        if (storage.fmSavedOptions)
            options = storage.fmSavedOptions;
    });
}

function savePanelsToMemory() {
    const clearSaveData = () => chrome.storage.local.remove(["fmSavedSearch"]);

    obtainActiveID((id) => {
        if (!tabsData.has(id)) {
            clearSaveData();
            return;
        }
        chrome.storage.local.set({ "fmSavedSearch": tabsData.get(id) });
        showSuccessStatus();
    }, () => {
        clearSaveData();
        showSuccessStatus();
    }
    );
}

function loadPanelsToActive() {
    obtainActiveID((id) => {
        chrome.storage.local.get("fmSavedSearch", (storage) => {
            const loadedData = storage.fmSavedSearch;
            if (!loadedData)
                return;

            tabsData.set(id, loadedData);
            sendSearchData(id, { loadedData, forcedUpdate: true});
            showSuccessStatus();
        });
    });
}

var quedNewPanels = [];
function requestNewSearchOnActiveWindow() {
    obtainActiveID((id) => {
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