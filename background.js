var quedIdsForNewPanels = [];
var TabsData = new Map();
var options;

loadOptions();

chrome.commands.onCommand.addListener((HOTKEY_COMMAND) => {
    switch (HOTKEY_COMMAND)
    {
        case 'fm-new-search':
            requestNewSearchOnActiveWindow();
            break;
        case 'fm-save-search':
            savePanelsToMemory();
            break;
        case 'fm-load-search':
            loadPanelsToActive();
            break;
    }
});

chrome.runtime.onMessage.addListener((_RUNTIME_EVENT, _sender) => {
    const tabId = _RUNTIME_EVENT.tabId;
    const data = _RUNTIME_EVENT.data;

    switch (_RUNTIME_EVENT.message)
    {
        case "fm-popup-options-change":
            {
                if (!_RUNTIME_EVENT.options)
                    return;

                options = _RUNTIME_EVENT.options;
                obtainActiveID((_id) =>
                {
                    sendSearchData(_id);
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
            obtainActiveID((id) =>
            {
                message.id = id;
                message.data = TabsData.has(id);
                chrome.runtime.sendMessage(message);
            },
                () =>
            {
                chrome.runtime.sendMessage(message);
            });
            break;

        case "fm-content-update-state":
            if (data)
                TabsData.set(tabId, data);
            else if (TabsData.has(tabId))
                TabsData.delete(_RUNTIME_EVENT.tabId)
            break;

        case "fm-content-script-loaded":
            const newTabId = _sender.tab.id;
            const previousTabData = TabsData.get(newTabId);
            if (previousTabData)
                sendSearchData(newTabId, previousTabData, FORCED_UPDATE = false, PINNED_ONLY = true);

            if (quedIdsForNewPanels.includes(newTabId))
            {
                chrome.tabs.sendMessage(newTabId,
                    {
                        message: "fm-new-search",
                        tabId: newTabId,
                        options: options
                    });
                quedIdsForNewPanels.splice(quedIdsForNewPanels.indexOf(newTabId), 1);
            }
            break;
    }
});

chrome.windows.onBoundsChanged.addListener(function ()
{
    TabsData.forEach((data, id) =>
    {
        sendSearchData(id, data, FORCED_UPDATE = true, PINNED_ONLY = false);
    });
});

function obtainActiveID(onActiveID, onNoActive)
{
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) =>
    {
        const url = tabs ? tabs[0]?.url : null;
        if (url && !url.startsWith('chrome://'))
            onActiveID((Number)(tabs[0].id));
        else
            onNoActive?.call();
    });
}

function sendSearchData(tabId, tabData, forced, pinnedOnly)
{
    const message = {
        message: "fm-update-search",
        tabId: tabId,
        options: options,
        data: tabData,
        forcedUpdate: forced,
        pinnedOnly: pinnedOnly
    };

    chrome.tabs.sendMessage(tabId, message);
}

function loadOptions()
{

    chrome.storage.sync.get("fmSavedOptions", function (_storage)
    {
        if (_storage.fmSavedOptions)
        {
            options = _storage.fmSavedOptions;
        }
    });
}

function savePanelsToMemory()
{
    const clearSaveData = () =>
    {
        chrome.storage.local.remove(["fmSavedSearch"]);
    };
    obtainActiveID(
        (id) =>
        {
            if (!TabsData.has(id))
            {
                clearSaveData();
                return;
            }
            chrome.storage.local.set({ "fmSavedSearch": TabsData.get(id) });
            showSuccessStatus();
        },
        () =>
        {
            clearSaveData();
            showSuccessStatus();
        });
}

function loadPanelsToActive()
{
    obtainActiveID((id) =>
    {
        chrome.storage.local.get("fmSavedSearch", (storage) =>
        {
            const loadedData = storage.fmSavedSearch;
            if (!loadedData)
                return;

            TabsData.set(id, loadedData);
            sendSearchData(id, loadedData, FORCED = true, PINNED_ONLY = false);
            showSuccessStatus();
        });
    });
}

function requestNewSearchOnActiveWindow() 
{
    obtainActiveID((id) =>
    {
        chrome.tabs.sendMessage(id,
            { message: "fm-new-search", tabId: id, options: options },
            (response) =>
            {
                const NO_RESPONSE_FROM_CONTENT_SCRIPT = new Boolean(chrome.runtime.lastError);
                if (NO_RESPONSE_FROM_CONTENT_SCRIPT && !quedIdsForNewPanels.includes(id))
                    quedIdsForNewPanels.push(id);
            });

    });
}

function showSuccessStatus(_time = 3000)
{
    chrome.action.setBadgeText({
        text: "\u{2713}"
    });

    setTimeout(() =>
    {
        chrome.action.setBadgeText({
            text: ""
        });
    }, _time);
}