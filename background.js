
var TabData = new Map();

chrome.commands.onCommand.addListener(function(command) {
  if (command === 'toggle-search') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      let activeId = (Number)(tabs[0].id);
      if (!(data = TabData.get(activeId)))
        data = new Object();
      data.open = true;
      updateSearch(activeId, data);
    })};

    //const newDiv = document.createElement('input');
    //document.body.appendChild(newDiv);
    //console.log('Hotkey pressed!');

});

chrome.runtime.onMessage.addListener(function(e) {
  switch (e.message)
  {
    case "update_content":
      TabData.set(e.tabId, e.data);
      break;
  }
});

chrome.windows.onBoundsChanged.addListener(function() {
  console.log("bound change event triggered");

  let keyIterator = TabData.keys();
  while (iKey = keyIterator.next().value)
  {
    if (TabData.get(iKey).open)
    {
      updateSearch(iKey, TabData.get(iKey), FORCED_UPDATE = true);
    }
  }
});

chrome.tabs.onUpdated.addListener(function(tabId, changeinfo){
  console.log("update event triggered");
  //console.log("updating page");
  //console.log(changeinfo);
  if (changeinfo.status && changeinfo.status == "complete" && TabData.has(tabId))
  {
    updateSearch(tabId, TabData.get(tabId));
  }
  //chrome.tabs.sendMessage(tabId, {message:"page_reloaded"});
});

function updateSearch(_tabId, _tabData, _forced)
{
    var message = { message: "update_search", tabId: _tabId};
    if (_tabData)
      message.data =_tabData;

    if (_forced)
      message.forcedUpdate = true;

    chrome.tabs.sendMessage(_tabId, message);
}

//run when extension is loaded
chrome.runtime.onInstalled.addListener(() => {
  console.log("extensions is on")
    chrome.action.setBadgeText({
      text: "ON",
    });
  });

