console.log("popup script loaded");
//chrome.action.setBadgeText({
//    text: "OFF",
  //});

document.addEventListener('DOMContentLoaded', function ()
{
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

    const optionChange = () => 
    {
        const options = buildOptions();
        saveOptions(options);
        sendOptions(options);
    };
    document.getElementById('tabsCorner')?.addEventListener("change", optionChange);
    document.getElementById('tabsAlignment')?.addEventListener("change", optionChange);
    document.getElementById('startPinned')?.addEventListener("change", optionChange);
    document.getElementById('opacity')?.addEventListener("change", optionChange);

    loadOptions((_options) => { fillUI(_options); });
});

function sendOptions(_options)
{
    chrome.runtime.sendMessage({ message: "tf-popup-options-change", options: _options });
}

function buildOptions()
{
    let options = new Object();

    options.corner = document.getElementById('tabsCorner').selectedIndex;
    options.alignment = document.getElementById('tabsAlignment').selectedIndex;
    options.startPinned = new Boolean(document.getElementById('startPinned').checked);
    options.opacity = document.getElementById('opacity').value;

    return options;
}

function loadOptions(_onLoad)
{
    console.log("ya1");
    chrome.storage.sync.get("tfSavedOptions", function (_storage)
    {
        console.log("ya2");
        let options = _storage.tfSavedOptions;
        if (options)
            _onLoad(options);
    });
}
function fillUI(_options)
{
    console.log("ya3");
    document.getElementById('tabsCorner').selectedIndex = _options.corner;
    document.getElementById('tabsAlignment').selectedIndex = _options.alignment;
    document.getElementById('startPinned').checked = _options.startPinned;
    document.getElementById('opacity').value = _options.opacity;
}
function saveOptions(_options)
{
    chrome.storage.sync.set({ "tfSavedOptions": _options });
}