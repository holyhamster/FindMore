
var TabsData = new Map();

chrome.commands.onCommand.addListener(function (_HOTKEY_COMMAND) {
    if (_HOTKEY_COMMAND === 'toggle-search')
    {
        obtainActiveID(function(_id) {
            chrome.tabs.sendMessage(_id, { message: "tf-new-search", tabId: _id });
        });
    };
});

chrome.runtime.onMessage.addListener(function (_RUNTIME_EVENT, _sender)
{
    switch (_RUNTIME_EVENT.message)
    {
        case "tf-popup-new-search":
            obtainActiveID(function (_id) {
                chrome.tabs.sendMessage(_id, { message: "tf-new-search", tabId: _id });
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
                    updateSearch(_id, searchData, FORCED = true, PINNED_ONLY = false);
                });
            });
            break;

        case "tf-update-state":
            TabsData.set(_RUNTIME_EVENT.tabId, _RUNTIME_EVENT.data);
            break;

        case "tf-content-script-loaded":
            const tabData = TabsData.get(_sender.tab.id);
            console.log(tabData);
            if (tabData)
                updateSearch(_sender.tab.id, tabData, FORCED_UPDATE = false, PINNED_ONLY = true);
            break;
    }
});

chrome.windows.onBoundsChanged.addListener(function () {
    console.log("bound change event triggered");

    TabsData.forEach(function (_data, _id)
    {
        updateSearch(_id, _data, FORCED_UPDATE = true, PINNED_ONLY = false);
    });
});

chrome.tabs.onUpdated.addListener(function (tabId, changeinfo) {
    //console.log("updating page");
    //console.log(changeinfo);
    if (false && changeinfo.status && changeinfo.status == "complete" && TabsData.has(tabId)) {
        updateSearch(tabId, TabsData.get(tabId));
    }
    //chrome.tabs.sendMessage(tabId, {message:"page_reloaded"});
});

function obtainActiveID(_giveActiveId, _onNoActive)
{
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) =>
    {
        if (!tabs || tabs.length == 0)
        {
            if (_onNoActive)
                _onNoActive();
            return;
        }

        let activeId = (Number)(tabs[0].id);
        _giveActiveId(activeId);
    });
}

function updateSearch(_tabId, _tabData, _forced, _pinnedOnly)
{
    var message = { message: "tf-update-search", tabId: _tabId };

    message.data = _tabData;
    message.forcedUpdate = _forced;
    message.pinnedOnly = _pinnedOnly;
    console.log(`update event sent`);
    console.log(JSON.stringify(message));
    chrome.tabs.sendMessage(_tabId, message);
}

//run when extension is loaded
chrome.runtime.onInstalled.addListener(() => {
    console.log("extensions is on")
    chrome.action.setBadgeText({
        text: "ON",
    });
});

console.log("bg script loaded");