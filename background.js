
var TabsData = new Map();
window.localStorage.setItem("test", "test2");
chrome.commands.onCommand.addListener(function (command) {
    if (command === 'toggle-search')
    {
        openNewAtActiveTab();
    };
});

chrome.runtime.onMessage.addListener(function (_args, _sender)
{
    console.log(_args);
    switch (_args.message)
    {
        case "tf-popup-new-search":
            openNewAtActiveTab();
            break;
        case "tf-update-state":
            TabsData.set(_args.tabId, _args.data);

            console.log(`cached state ${_args.tabId} - ${JSON.stringify(_args.data)}`);
            console.log(JSON.stringify(TabsData));
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

    let keyIterator = TabsData.keys();
    while (tabId = keyIterator.next().value) {
        let tabData = TabsData.get(tabId);
        if (tabData)
            updateSearch(tabId, tabData, FORCED_UPDATE = true, PINNED_ONLY = false);
    }
});

chrome.tabs.onUpdated.addListener(function (tabId, changeinfo) {
    //console.log("updating page");
    //console.log(changeinfo);
    console.log(window.localStorage.getItem("test"));
    if (false && changeinfo.status && changeinfo.status == "complete" && TabsData.has(tabId)) {
        updateSearch(tabId, TabsData.get(tabId));
    }
    //chrome.tabs.sendMessage(tabId, {message:"page_reloaded"});
});

function openNewAtActiveTab()
{
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) =>
    {
        if (tabs && tabs.length > 0)
        {
            let activeId = (Number)(tabs[0].id);
            chrome.tabs.sendMessage(activeId, { message: "new_search", tabId: activeId });
        }
    })
}
function updateSearch(_tabId, _tabData, _forced, _pinnedOnly)
{
    
    var message = { message: "update_search", tabId: _tabId };

    message.data = _tabData;
    message.forcedUpdate = _forced;
    message.pinnedOnly = _pinnedOnly;
    console.log(`update event sent`);
    console.log(JSON.stringify(message));
    chrome.tabs.sendMessage(_tabId, message);
}

function tabIdHasPersistantSearches(_tabId)
{
    if (!TabsData.has(_tabId))
        return false;
}

//run when extension is loaded
chrome.runtime.onInstalled.addListener(() => {
    console.log("extensions is on")
    chrome.action.setBadgeText({
        text: "ON",
    });
});

console.log("bg script loaded");