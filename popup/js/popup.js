console.log("popup script loaded");
//chrome.action.setBadgeText({
//    text: "OFF",
  //});

document.addEventListener('DOMContentLoaded', function ()
{
    var findButton = document.getElementById('popupFindButton');
    findButton.addEventListener('click', function ()
    {
        chrome.runtime.sendMessage({ message: "tf-popup-new-search" });
        close();
    });

    var saveButton = document.getElementById('popupSaveButton');
    saveButton.addEventListener('click', function ()
    {
        chrome.runtime.sendMessage({ message: "tf-popup-save-search" });
        close();
    });

    var loadButton = document.getElementById('popupLoadButton');
    saveButton.addEventListener('click', function ()
    {
        chrome.runtime.sendMessage({ message: "tf-popup-load-search" });
        close();
    });
});