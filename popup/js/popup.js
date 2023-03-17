//chrome.action.setBadgeText({
//    text: "OFF",
  //});

document.addEventListener('DOMContentLoaded', () =>
{
    const commitOptions = () => 
    {
        const options = buildOptions();
        saveOptions(options);
        sendOptionsToBackground(options);
    };
    
    chrome.runtime.onMessage.addListener((event) =>
    {
        if (event.message == "fm-popup-current-search-answer")
            setSavedButtonAs(!isNaN(event.id), event.data);
    });

    document.getElementById('findButton')?.addEventListener('click', () =>
    {
        chrome.runtime.sendMessage({ message: "fm-popup-new-search" });
        close();
    });

    document.getElementById('saveButton')?.addEventListener('click', () =>
    {
        chrome.runtime.sendMessage({ message: "fm-popup-save-search" });
        close();
    });

    document.getElementById('loadButton')?.addEventListener('click', () =>
    {
        chrome.runtime.sendMessage({ message: "fm-popup-load-search" });
        close();
    });

    const cornerButton = document.getElementById('cornerButton');
    cornerButton.selectIndex = (index) =>
    {
        cornerButton.selectedIndex = index <= 3? index : 0;
        switch (index)
        {
            case 1:
                cornerButton.textContent = `\u{25F2}`;
                break;         
            case 2:
                cornerButton.textContent = `\u{25F1}`;
                break;
            case 3:
                cornerButton.textContent = `\u{25F0}`;
                break;
            default:
                cornerButton.textContent = `\u{25F3}`;
                break;
        }
    }
    cornerButton?.addEventListener('click', () =>
    {
        cornerButton.selectIndex((cornerButton.selectedIndex || 0) + 1);
        commitOptions();
    });
    

    const alignmentButton = document.getElementById('alignmentButton');
    alignmentButton.selectIndex = (index) =>
    {
        alignmentButton.selectedIndex = index || 0;
        if (index === 1)
            alignmentButton.textContent = `\u{21C6}`;
        else
            alignmentButton.textContent = `\u{21C5}`;
    }
    alignmentButton?.addEventListener('click', (_args) =>
    {
        alignmentButton.selectIndex((alignmentButton.selectedIndex || 0) === 0 ? 1 : 0);
        commitOptions();
    });

    const pinButton = document.getElementById('pinButton');
    pinButton.selectIndex = (index) =>
    {
        pinButton.selectedIndex = index || 0;
        if (index === 1)
            pinButton.textContent = `\u{25A3}`;
        else
            pinButton.textContent = `\u{25A2}`;
    }
    pinButton?.addEventListener('click', (_args) =>
    {
        pinButton.selectIndex((pinButton.selectedIndex || 0) === 0 ? 1 : 0);
        commitOptions();
    });

    const optionTogglesID = ["opacity", "scale"];
    optionTogglesID.forEach((_id) =>
    {
        document.getElementById(_id)?.addEventListener("change", commitOptions)
    });

    //fillUI();
    loadOptions();
    chrome.runtime.sendMessage({ message: "fm-popup-current-search-request" });
});

function buildOptions()
{
    const options = new Object();

    const cornerValue = document.getElementById('cornerButton')?.selectedIndex || 0;
    options.StartTop = cornerValue === 3 || cornerValue === 0;
    options.StartLeft = cornerValue === 3 || cornerValue === 2;
    options.Horizontal = document.getElementById('alignmentButton')?.selectedIndex === 1;
    options.StartPinned = document.getElementById('pinButton')?.selectedIndex === 1;
    options.MenuOpacity = document.getElementById('opacity')?.value || 1;
    options.MenuScale = document.getElementById('scale')?.value || 1;
    options.HighlightOpacity = document.getElementById('highlightOpacity')?.value || 1;  //TODO

    return options;
}

function fillUIWithOptions(options)
{
    const cornerIndex =
        (options.StartTop & options.StartLeft ? 3 : 0) +
        (options.StartTop & !options.StartLeft ? 0 : 0) +
        (!options.StartTop & !options.StartLeft ? 1 : 0) +
        (!options.StartTop & options.StartLeft ? 2 : 0);
    document.getElementById('cornerButton').selectIndex(cornerIndex || 0);
    document.getElementById('alignmentButton').selectIndex(options?.Horizontal? 1 : 0);
    document.getElementById('pinButton').selectIndex(options?.StartPinned ? 1 : 0);
    document.getElementById('opacity').value = options?.MenuOpacity || 1;
    document.getElementById('scale').value = options?.MenuScale || 1;
}

function loadOptions()
{
    chrome.storage.sync.get("fmSavedOptions", function (_storage)
    {
        
        const options = _storage.fmSavedOptions;
        fillUIWithOptions(options);
    });

    chrome.runtime.sendMessage("fm-popup-current-search-request");
}

function setSavedButtonAs(hasActiveWindow, hasActiveSearches)
{
    const saveButton = document.getElementById('saveButton');
    const loadButton = document.getElementById('loadButton');
    
    chrome.storage.local.get("fmSavedSearch", (_storage) =>
    {
        const hasSavedData = Boolean(_storage.fmSavedSearch);
        loadButton.disabled = !(hasSavedData && hasActiveWindow);
        saveButton.disabled = !(hasActiveSearches || hasSavedData);
        const saveButtonClearsInstead = !hasActiveSearches && hasSavedData;
        saveButton.innerHTML = saveButtonClearsInstead ? "Clear" : "Save";
        document.getElementById('saveTooltip').innerHTML = saveButtonClearsInstead ?
            "Clear saved panels" : "Save current panels";
    });

}

function saveOptions(options)
{
    console.log(options)
    chrome.storage.sync.set({ "fmSavedOptions": options });
}

function sendOptionsToBackground(options)
{
    chrome.runtime.sendMessage({ message: "fm-popup-options-change", options: options });
}