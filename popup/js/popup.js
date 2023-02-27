console.log("popup script loaded");
//chrome.action.setBadgeText({
//    text: "OFF",
  //});

document.addEventListener('DOMContentLoaded', function ()
{
    var options = new Object();

    var findButton = document.getElementById('findButton');
    findButton.addEventListener('click', function ()
    {
        chrome.runtime.sendMessage({ message: "tf-popup-new-search" });
        close();
    });

    var saveButton = document.getElementById('saveButton');
    saveButton.addEventListener('click', function ()
    {
        chrome.runtime.sendMessage({ message: "tf-popup-save-search" });
        close();
    });

    var loadButton = document.getElementById('loadButton');
    loadButton.addEventListener('click', function ()
    {
        chrome.runtime.sendMessage({ message: "tf-popup-load-search" });
        close();
    });

    var cornerDropdown = document.getElementById('tabsCorner');
    cornerDropdown.addEventListener("change", (_event) =>
    {
        if (_event.target?.selectedIndex >= 0)
        {
            saveOptions();
            sendOptions();
        }
    });

    document.getElementById('tabsAlignment').addEventListener("change", (_event) =>
    {
        if (_event.target?.selectedIndex >= 0)
        {
            saveOptions();
            sendOptions();
        }
    });

    loadOptions();
});

function sendOptions()
{
    chrome.runtime.sendMessage({ message: "tf-popup-options-change", options: buildOptions() });
}

function buildOptions()
{
    let options = new Object();

    options.corner = document.getElementById('tabsCorner').selectedIndex;
    options.alignment = document.getElementById('tabsAlignment').selectedIndex;
    return options;
}

function loadOptions()
{
    chrome.storage.sync.get("tfSavedOptions", function (_storage)
    {
        let options = _storage.tfSavedOptions;
        if (!options)
            return;
        console.log("loaded");
        document.getElementById('tabsCorner').selectedIndex = options.corner;
        document.getElementById('tabsAlignment').selectedIndex = options.alignment
    });
}

function saveOptions()
{
    chrome.storage.sync.set({ "tfSavedOptions": buildOptions() });
}