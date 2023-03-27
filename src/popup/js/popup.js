//Script running inside extension popup document
//Builds Options() according to its ui, communicates with background script via runtime events

document.addEventListener('DOMContentLoaded', () => {
    

    chrome.runtime.onMessage.addListener((event) => {
        if (event.context == "fm-popup-current-search-answer")
            setSavedButtonAs(!isNaN(event.id), event.hasData);
    });
    chrome.runtime.sendMessage({ context: "fm-popup-current-search-request" });

    addEventsToUI();

    Options.FillFromMemory();

});

function addEventsToUI() {
    const commitOptions = () => {
        const options = Options.GetFromUI();
        Options.Save(options);
        Options.SendToBackground(options);
    };

    document.getElementById('findButton')?.addEventListener('click', () => {
        chrome.runtime.sendMessage({ context: "fm-popup-new-search" });
        close();
    });

    document.getElementById('saveButton')?.addEventListener('click', () => {
        chrome.runtime.sendMessage({ context: "fm-popup-save-search" });
        close();
    });

    document.getElementById('loadButton')?.addEventListener('click', () => {
        chrome.runtime.sendMessage({ context: "fm-popup-load-search" });
        close();
    });

    const cornerButton = document.getElementById('cornerButton');
    cornerButton.selectIndex = (index) => {
        cornerButton.selectedIndex = index <= 3 ? index : 0;
        switch (index) {
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
    cornerButton?.addEventListener('click', () => {
        cornerButton.selectIndex((cornerButton.selectedIndex || 0) + 1);
        commitOptions();
    });


    const alignmentButton = document.getElementById('alignmentButton');
    alignmentButton.selectIndex = (index) => {
        alignmentButton.selectedIndex = index || 0;
        if (index === 1)
            alignmentButton.textContent = `\u{21C6}`;
        else
            alignmentButton.textContent = `\u{21C5}`;
    }
    alignmentButton?.addEventListener('click', (_args) => {
        alignmentButton.selectIndex((alignmentButton.selectedIndex || 0) === 0 ? 1 : 0);
        commitOptions();
    });

    const pinButton = document.getElementById('pinButton');
    pinButton.selectIndex = (index) => {
        pinButton.selectedIndex = index || 0;
        if (index === 1)
            pinButton.textContent = `\u{25A3}`;
        else
            pinButton.textContent = `\u{25A2}`;
    }

    pinButton?.addEventListener('click', (_args) => {
        pinButton.selectIndex((pinButton.selectedIndex || 0) === 0 ? 1 : 0);
        commitOptions();
    });

    const optionTogglesID = ["opacity", "scale"];
    optionTogglesID.forEach((_id) => {
        document.getElementById(_id)?.addEventListener("change", commitOptions)
    });
}

class Options {
    static build() {
        const options = new Options();
        options.StartTop = false;
        options.StartLeft = false;
        options.Horizontal = false;
        options.StartPinned = false;
        options.MenuOpacity = 1;
        options.MenuScale = 1;
        options.HighlightOpacity = 0.45; 
        return options;
    }
    static GetFromUI() {
        const options = Options.build();
        const cornerValue = document.getElementById('cornerButton')?.selectedIndex;
        if (typeof cornerValue === 'number') {
            options.StartTop = cornerValue === 3 || cornerValue === 0;
            options.StartLeft = cornerValue === 3 || cornerValue === 2;
        }
        const alignmentIndex = document.getElementById('alignmentButton')?.selectedIndex;
        if (typeof alignmentIndex === 'number')
            options.Horizontal = alignmentIndex === 1;

        const pinnedIndex = document.getElementById('pinButton')?.selectedIndex;
        if (typeof pinnedIndex === 'number')
            options.StartPinned = pinnedIndex === 1;

        const opacityValue = parseFloat(document.getElementById('opacity')?.value);
        if (typeof opacityValue === 'number')
            options.MenuOpacity = opacityValue;

        const scaleValue = parseFloat(document.getElementById('scale')?.value);
        if (typeof scaleValue === 'number')
            options.MenuScale = scaleValue;
        //options.HighlightOpacity = document.getElementById('highlightOpacity')?.value || 1;  //TODO: add slider
        return options;
    }

    static FillFromMemory() {
        chrome.storage.sync.get("fmSavedOptions", function (storage) {
            Options.FillUI(storage?.fmSavedOptions || Options.build());
        });
    }

    static Save(options) {
        chrome.storage.sync.set({ "fmSavedOptions": options });
    }

    static FillUI(options) {
        const cornerIndex =
            (options.StartTop & options.StartLeft ? 3 : 0) +
            (options.StartTop & !options.StartLeft ? 0 : 0) +
            (!options.StartTop & !options.StartLeft ? 1 : 0) +
            (!options.StartTop & options.StartLeft ? 2 : 0);
        document.getElementById('cornerButton').selectIndex(cornerIndex || 0);
        document.getElementById('alignmentButton').selectIndex(options?.Horizontal ? 1 : 0);
        document.getElementById('pinButton').selectIndex(options?.StartPinned ? 1 : 0);
        document.getElementById('opacity').value = options.MenuOpacity || 1;
        document.getElementById('scale').value = options.MenuScale || 1;
    }

    static SendToBackground(options) {
        chrome.runtime.sendMessage({ context: "fm-popup-options-change", options: options });
    }
}

function setSavedButtonAs(hasActiveWindow, hasActiveSearches) {
    const saveButton = document.getElementById('saveButton');
    const loadButton = document.getElementById('loadButton');
    const newButton = document.getElementById('findButton');

    chrome.storage.local.get("fmSavedSearch", (_storage) => {
        const hasSavedData = Boolean(_storage.fmSavedSearch);
        loadButton.disabled = !(hasSavedData && hasActiveWindow);
        saveButton.disabled = !(hasActiveSearches || hasSavedData);
        newButton.disabled = !hasActiveWindow;
        const saveButtonClearsInstead = !hasActiveSearches && hasSavedData;
        saveButton.innerHTML = saveButtonClearsInstead ? "Clear" : "Save";
        document.getElementById('saveTooltip').innerHTML = saveButtonClearsInstead ?
            "Clear saved panels" : "Save current panels";
    });
}