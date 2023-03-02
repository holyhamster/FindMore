console.log("popup script loaded");
//chrome.action.setBadgeText({
//    text: "OFF",
  //});

document.addEventListener('DOMContentLoaded', () =>
{
    const optionChange = () => 
    {
        const options = buildOptions();
        saveOptions(options);
        sendOptions(options);
    };

    document.getElementById('findButton')?.addEventListener('click', () =>
    {
        chrome.runtime.sendMessage({ message: "tf-popup-new-search" });
        close();
    });

    document.getElementById('saveButton')?.addEventListener('click', () =>
    {
        chrome.runtime.sendMessage({ message: "tf-popup-save-search" });
        close();
    });

    document.getElementById('loadButton')?.addEventListener('click', () =>
    {
        chrome.runtime.sendMessage({ message: "tf-popup-load-search" });
        close();
    });

    document.getElementById('optionsToggle').addEventListener('click', () =>
    {
        const optionsStyle = document.getElementById('optionsExpanding').style;
        if (!optionsStyle)
            return;
        optionsStyle.expanded = !optionsStyle.expanded;
        if (optionsStyle.expanded)
            optionsStyle.display = "block";
        else
            optionsStyle.display = "none";
        optionChange();
    });

    const optionTogglesID = ["tabsCorner", "tabsAlignment", "startPinned", "opacity", "scale"];
    optionTogglesID.forEach((_id) =>
    {
        document.getElementById(_id)?.addEventListener("change", optionChange)
    });
    
    loadOptions((_options) => { fillUI(_options); });
});

function sendOptions(_options)
{
    chrome.runtime.sendMessage({ message: "tf-popup-options-change", options: _options });
}

function buildOptions()
{
    let options = new Object();

    options.corner = document.getElementById('tabsCorner')?.selectedIndex;
    options.alignment = document.getElementById('tabsAlignment')?.selectedIndex;
    options.startPinned = document.getElementById('startPinned')?.checked;
    options.opacity = document.getElementById('opacity')?.value;
    options.scale = document.getElementById('scale')?.value;
    options.optionsExpanded = document.getElementById('optionsExpanding')?.style.expanded;
    return options;
}

function loadOptions(_onLoad)
{
    
    chrome.storage.sync.get("tfSavedOptions", function (_storage)
    {
        let options = _storage.tfSavedOptions;
        console.log(options);
        if (options)
            _onLoad(options);
    });
}

function fillUI(_options)
{
    document.getElementById('tabsCorner').selectedIndex = _options.corner;
    document.getElementById('tabsAlignment').selectedIndex = _options.alignment;
    document.getElementById('startPinned').checked = _options.startPinned;
    document.getElementById('opacity').value = _options.opacity;
    document.getElementById('scale').value = _options.scale;

    document.getElementById('optionsExpanding').style.expanded = _options.optionsExpanded === true;
    console.log(document.getElementById('optionsExpanding').style.expanded)
    if (_options.optionsExpanded === true)
        document.getElementById('optionsExpanding').style = "block";
}

function saveOptions(_options)
{
    chrome.storage.sync.set({ "tfSavedOptions": _options });
}