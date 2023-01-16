
var TabData = new Map();
var TabState = new Map();

chrome.commands.onCommand.addListener(function(command) {
  if (command === 'toggle-search') {
    openSearch();
    //const newDiv = document.createElement('input');
    //document.body.appendChild(newDiv);
    //console.log('Hotkey pressed!');
  }
});

chrome.runtime.onMessage.addListener(function(e) {
  switch (e.message)
  {
    case "update_content":
      TabData.set(e.tabId, e.data);
      TabState.set(e.tabId, e.state);
      break;
  }
});

chrome.tabs.onUpdated.addListener(function(tabId, changeinfo){

  //console.log("updating page");
  //console.log(changeinfo);
  if (changeinfo.status && changeinfo.status == "complete" && TabData.has(tabId))
  {
    console.log("updating page:");
    var message = { message: "tab_updated", data: TabData.get(tabId), tabId: tabId, state: TabState.get(tabId) };
    chrome.tabs.sendMessage(tabId, message);
  }
  //chrome.tabs.sendMessage(tabId, {message:"page_reloaded"});
});

function openSearch()
{

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      var activeId = (Number)(tabs[0].id);

      var message = { message: "open_search", tabId: activeId };
      if (TabData.has(activeId))
        message.data = TabData.get(activeId);

      chrome.tabs.sendMessage(activeId, message);
      console.log(TabData);
       //$('#status').html('changed data in page');
  });
};




//chrome.action.onClicked.addListener(async (tab) => {
    //chrome.action.setBadgeText({
     // text: "OFF",
    //});

    //if (tab.url.startsWith(extensions) || tab.url.startsWith(webstore)) {
      // Retrieve the action badge to check if the extension is 'ON' or 'OFF'
      //const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
      // Next state will always be the opposite
//      const nextState = prevState === 'ON' ? 'OFF' : 'ON'

      // Set the action badge to the next state
      //await chrome.action.setBadgeText({
        //tabId: tab.id,
//        text: nextState,
      //});
//
      //if (nextState === "ON") {
        //// Insert the CSS file when the user turns the extension on
        //await chrome.scripting.insertCSS({
          //files: ["focus-mode.css"],
          //target: { tabId: tab.id },
//        });
      //} else if (nextState === "OFF") {
        // Remove the CSS file when the user turns the extension off
        //await chrome.scripting.removeCSS({
          //files: ["focus-mode.css"],
          //target: { tabId: tab.id },
//        });
      //}
//    }
  //});

//run when extension is loaded
chrome.runtime.onInstalled.addListener(() => {
  console.log("extensions is on")
    chrome.action.setBadgeText({
      text: "ON",
    });
  });

