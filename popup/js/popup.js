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

    document.getElementById('optionsToggle')?.addEventListener('click', () =>
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

    const cornerButton = document.getElementById('cornerButton');
    cornerButton.selectIndex = (_index) =>
    {
        cornerButton.selectedIndex = _index || 0;
        console.log(_index)
        switch (_index)
        {
            case 1:
                cornerButton.textContent = `\u{25F3}`;
                break;
            case 2:
                cornerButton.textContent = `\u{25F1}`;
                break;
            case 3:
                cornerButton.textContent = `\u{25F2}`;
                break;
            default:
                cornerButton.textContent = `\u{25F0}`;

        }
    }
    cornerButton?.addEventListener('click', (_args) =>
    {
        const index = (cornerButton.selectedIndex || 0) + 1;
        cornerButton.selectIndex(index <= 3 ? index : 0);
        optionChange();
    });
    

    const alignmentButton = document.getElementById('alignmentButton');
    alignmentButton.selectIndex = (_index) =>
    {
        alignmentButton.selectedIndex = _index || 0;
        if (_index === 1)
            alignmentButton.textContent = `\u{21C6}`;
        else
            alignmentButton.textContent = `\u{21C5}`;
    }
    alignmentButton?.addEventListener('click', (_args) =>
    {
        alignmentButton.selectIndex((alignmentButton.selectedIndex || 0) === 0 ? 1 : 0);
        optionChange();
    });

    const pinButton = document.getElementById('pinButton');
    pinButton.selectIndex = (_index) =>
    {
        pinButton.selectedIndex = _index || 0;
        if (_index === 1)
            pinButton.textContent = `\u{25A3}`;
        else
            pinButton.textContent = `\u{25A2}`;
    }
    pinButton?.addEventListener('click', (_args) =>
    {
        pinButton.selectIndex((pinButton.selectedIndex || 0) === 0 ? 1 : 0);
        optionChange();
    });

    const optionTogglesID = ["opacity", "scale"];
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

    options.corner = document.getElementById('cornerButton')?.selectedIndex || 0;
    options.alignment = document.getElementById('alignmentButton')?.selectedIndex || 0;
    options.startPinned = document.getElementById('pinButton')?.selectedIndex === 1;
    options.opacity = document.getElementById('opacity')?.value;
    options.scale = document.getElementById('scale')?.value;

    //options.optionsExpanded = document.getElementById('optionsExpanding')?.style.expanded;
    
    return options;
}

function loadOptions(_onLoad)
{
    
    chrome.storage.sync.get("tfSavedOptions", function (_storage)
    {
        let options = _storage.tfSavedOptions;

        if (options)
            _onLoad(options);
    });
}

function fillUI(_options)
{
    document.getElementById('cornerButton').selectIndex(_options.corner);
    document.getElementById('alignmentButton').selectIndex(_options.alignment);
    document.getElementById('pinButton').selectIndex(_options.startPinned? 1: 0);
    document.getElementById('opacity').value = _options.opacity;
    document.getElementById('scale').value = _options.scale;

    //document.getElementById('optionsExpanding').style.expanded = _options.optionsExpanded === true;
    //if (_options.optionsExpanded === true)
        //document.getElementById('optionsExpanding').style = "block";
}

function saveOptions(_options)
{
    chrome.storage.sync.set({ "tfSavedOptions": _options });
}