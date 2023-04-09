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
interface IndexedElement extends HTMLElement{
    selectedIndex: number;
    selectIndex: (i: number) => void;
}
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

    const cornerButton = document.getElementById('cornerButton') as IndexedElement;
    cornerButton.selectIndex = (index) => {
        cornerButton.selectedIndex = index <= 3 ? index : 0;
        switch (index) {
            case 1:
                cornerButton.innerHTML = `\u25F2`;
                break;
            case 2:
                cornerButton.innerHTML = `\u25F1`;
                break;
            case 3:
                cornerButton.innerHTML = '\u25F0';
                break;
            default:
                cornerButton.innerHTML = `\u25F3`;
                break;
        }
    }
    cornerButton?.addEventListener('click', () => {
        cornerButton.selectIndex((cornerButton.selectedIndex || 0) + 1);
        commitOptions();
    });


    const alignmentButton = document.getElementById('alignmentButton') as IndexedElement;
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

    const pinButton = document.getElementById('pinButton') as IndexedElement;
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
    public StartTop = false;
    public StartLeft = false;
    public Horizontal = false;
    public StartPinned = false;
    public MenuOpacity = 1;
    public MenuScale = 1;
    public HighlightOpacity = 0.45;

    static GetFromUI() {
        const options = new Options();
        const cornerValue = 
            (document.getElementById('cornerButton') as IndexedElement)?.selectedIndex;
        if (typeof cornerValue === 'number') {
            options.StartTop = cornerValue === 3 || cornerValue === 0;
            options.StartLeft = cornerValue === 3 || cornerValue === 2;
        }
        const alignmentIndex =
            (document.getElementById('alignmentButton') as IndexedElement)?.selectedIndex;
        if (typeof alignmentIndex === 'number')
            options.Horizontal = alignmentIndex === 1;

        const pinnedIndex =
            (document.getElementById('pinButton') as IndexedElement)?.selectedIndex;
        if (typeof pinnedIndex === 'number')
            options.StartPinned = pinnedIndex === 1;

        const opacityValue =
            parseFloat((document.getElementById('opacity') as any)?.value);
        if (typeof opacityValue === 'number')
            options.MenuOpacity = opacityValue;

        const scaleValue = parseFloat((document.getElementById('scale')as any)?.value);
        if (typeof scaleValue === 'number')
            options.MenuScale = scaleValue;
        //options.HighlightOpacity = document.getElementById('highlightOpacity')?.value || 1;  //TODO: add slider
        return options;
    }

    static FillFromMemory() {
        chrome.storage.sync.get("fmSavedOptions", function (storage) {
            Options.FillUI(storage?.fmSavedOptions || new Options());
        });
    }

    static Save(options: any) {
        chrome.storage.sync.set({ "fmSavedOptions": options });
    }

    static FillUI(options: any) {
        const cornerIndex =
            (options.StartTop && options.StartLeft ? 3 : 0) +
            (options.StartTop && !options.StartLeft ? 0 : 0) +
            (!options.StartTop && !options.StartLeft ? 1 : 0) +
            (!options.StartTop && options.StartLeft ? 2 : 0);
        (document.getElementById('cornerButton') as IndexedElement).selectIndex(cornerIndex || 0);
        (document.getElementById('alignmentButton') as IndexedElement).selectIndex(options?.Horizontal ? 1 : 0);
        (document.getElementById('pinButton') as IndexedElement).selectIndex(options?.StartPinned ? 1 : 0);
        (document.getElementById('opacity')as any).value = options.MenuOpacity || 1;
        (document.getElementById('scale') as any).value = options.MenuScale || 1;
    }

    static SendToBackground(options: Options) {
        chrome.runtime.sendMessage({ context: "fm-popup-options-change", options: options });
    }
}

function setSavedButtonAs(hasActiveWindow: boolean, hasActiveSearches: boolean) {
    const saveButton = document.getElementById('saveButton') as any;
    const loadButton = document.getElementById('loadButton') as any;
    const newButton = document.getElementById('findButton') as any;

    chrome.storage.local.get("fmSavedSearch", (_storage) => {
        const hasSavedData = Boolean(_storage.fmSavedSearch);
        loadButton.disabled = !(hasSavedData && hasActiveWindow);
        saveButton.disabled = !(hasActiveSearches || hasSavedData);
        newButton.disabled = !hasActiveWindow;
        const saveButtonClearsInstead = !hasActiveSearches && hasSavedData;
        saveButton.innerHTML = saveButtonClearsInstead ? "Clear" : "Save";
        (document.getElementById('saveTooltip') as any).innerHTML = saveButtonClearsInstead ?
            "Clear saved panels" : "Save current panels";
    });
}