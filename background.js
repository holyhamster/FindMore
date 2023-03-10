var quedIdsForNewPanels = [];
var TabsData = new Map();
var options;
loadOptions();

chrome.commands.onCommand.addListener((_HOTKEY_COMMAND) =>
{
    switch (_HOTKEY_COMMAND)
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

chrome.runtime.onMessage.addListener((_RUNTIME_EVENT, _sender) =>
{
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
            obtainActiveID((_id) =>
            {
                message.id = _id;
                message.data = TabsData.has(_id);
                chrome.runtime.sendMessage(message);
            }, () =>
            {
                chrome.runtime.sendMessage(message);
            });
            break;

        case "tf-content-update-state":
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
                        message: "tf-new-search",
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
    TabsData.forEach(function (_data, _id)
    {
        sendSearchData(_id, _data, FORCED_UPDATE = true, PINNED_ONLY = false);
    });
});

function obtainActiveID(_onActiveID, _onNoActive)
{
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) =>
    {
        if (!tabs || tabs.length == 0 || tabs[0].url.startsWith('chrome://'))
        {
            _onNoActive?.call();
            return;
        }
        _onActiveID((Number)(tabs[0].id));
    });
}

function sendSearchData(_tabId, _tabData, _forced, _pinnedOnly)
{
    const message = {
        message: "tf-update-search",
        tabId: _tabId,
        options: options,
        data: _tabData,
        forcedUpdate: _forced,
        pinnedOnly: _pinnedOnly
    };

    chrome.tabs.sendMessage(_tabId, message);
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
        (_id) =>
        {
            if (!TabsData.has(_id))
            {
                clearSaveData();
                return;
            }
            chrome.storage.local.set({ "fmSavedSearch": TabsData.get(_id) });
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
    obtainActiveID((_id) =>
    {
        chrome.storage.local.get("fmSavedSearch", (_storage) =>
        {
            const loadedData = _storage.fmSavedSearch;
            if (!loadedData)
                return;

            TabsData.set(_id, loadedData);
            sendSearchData(_id, loadedData, FORCED = true, PINNED_ONLY = false);
            showSuccessStatus();
        });
    });
}

function requestNewSearchOnActiveWindow() 
{
    obtainActiveID((_id) =>
    {
        chrome.tabs.sendMessage(_id,
            { message: "tf-new-search", tabId: _id, options: options },
            (_response) =>
            {
                const NO_RESPONSE_FROM_CONTENT_SCRIPT = new Boolean(chrome.runtime.lastError);
                if (NO_RESPONSE_FROM_CONTENT_SCRIPT && !quedIdsForNewPanels.includes(_id))
                    quedIdsForNewPanels.push(_id);
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