
var TabsData = new Map();
var options;
loadOptions();

chrome.commands.onCommand.addListener(function (_HOTKEY_COMMAND) {
    if (_HOTKEY_COMMAND === 'toggle-search')
    {
        console.log("here");
        obtainActiveID(function (_id)
        {
            console.log(_id);
            chrome.tabs.sendMessage(_id, { message: "tf-new-search", tabId: _id, options: options });
        });
    };
});

chrome.runtime.onMessage.addListener(function (_RUNTIME_EVENT, _sender)
{
    switch (_RUNTIME_EVENT.message)
    {
        case "tf-popup-options-change":
            {
                if (!_RUNTIME_EVENT.options)
                    return;

                options = _RUNTIME_EVENT.options;
                obtainActiveID(function (_id)
                {
                    chrome.tabs.sendMessage(_id,
                        { message: "tf-options-update", tabId: _id, options: options });
                });
            }
            break;
        case "tf-popup-new-search":
            obtainActiveID(function (_id)
            {
                chrome.tabs.sendMessage(_id, { message: "tf-new-search", tabId: _id, options: options });
            });
            break;

        case "tf-popup-save-search":
            obtainActiveID((_id) =>
            {
                if (!TabsData.has(_id))
                    return;
                chrome.storage.local.set({ "tfSavedSearch": TabsData.get(_id) });
            });     
            break;

        case "tf-popup-load-search":
            obtainActiveID((_id) =>
            {
                chrome.storage.local.get("tfSavedSearch", function (_storage)
                {
                    let searchData = _storage.tfSavedSearch;
                    TabsData.set(_id, searchData);
                    sendSearchData(_id, searchData, FORCED = true, PINNED_ONLY = false);
                });
            });
            break;

        case "tf-content-update-state":
            TabsData.set(_RUNTIME_EVENT.tabId, _RUNTIME_EVENT.data);
            break;

        case "tf-content-script-loaded":
            const previousTabData = TabsData.get(_sender.tab.id);
            if (previousTabData)
                sendSearchData(_sender.tab.id, previousTabData, FORCED_UPDATE = false, PINNED_ONLY = true);
            break;
    }
});

chrome.windows.onBoundsChanged.addListener(function () {
    console.log("bound change event triggered");

    TabsData.forEach(function (_data, _id)
    {
        sendSearchData(_id, _data, FORCED_UPDATE = true, PINNED_ONLY = false);
    });
});

chrome.tabs.onUpdated.addListener(function (tabId, changeinfo) {
    if (false && changeinfo.status && changeinfo.status == "complete" && TabsData.has(tabId)) {
        sendSearchData(tabId, TabsData.get(tabId));
    }
});

function obtainActiveID(_giveActiveId, _onNoActive)
{
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) =>
    {
        if (!tabs || tabs.length == 0 || tabs[0].url.startsWith('chrome://'))
        {
            if (_onNoActive)
                _onNoActive();
            return;
        }
        _giveActiveId((Number)(tabs[0].id));
    });
}

function sendSearchData(_tabId, _tabData, _forced, _pinnedOnly)
{
    var message = { message: "tf-update-search", tabId: _tabId, options: options };

    message.data = _tabData;
    message.forcedUpdate = _forced;
    message.pinnedOnly = _pinnedOnly;
    console.log(`update event sent`);
    console.log(JSON.stringify(message));
    chrome.tabs.sendMessage(_tabId, message);
}

function loadOptions()
{
    
    chrome.storage.sync.get("tfSavedOptions", function (_storage)
    {
        if (_storage.tfSavedOptions)
        {
            options = _storage.tfSavedOptions;
        }
    });
}

//run when extension is loaded
chrome.runtime.onInstalled.addListener(() => {
    console.log("extensions is on")
    chrome.action.setBadgeText({
        text: "ON",
    });
});

console.log("bg script loaded");