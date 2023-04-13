//search options saved between sessions

export class Options {
    public StartTop = false;
    public StartLeft = false;
    public Horizontal = false;
    public StartPinned = false;
    public MenuOpacity = 1;
    public MenuScale = 1;
    public HighlightOpacity = 0.45;

    static TryLoad(
        onLoad: (options: Options) => void) {
        chrome.storage.sync.get("fmSavedOptions", (storage) => {
            const options: Options | undefined = storage?.fmSavedOptions as Options;
            if (options)
                onLoad(options);
            else
                onLoad(new Options());
        });
    }

    static Save(options: any) {
        chrome.storage.sync.set({ "fmSavedOptions": options });
    }

    static SendToBackground(options: Options) {
        chrome.runtime.sendMessage({ context: "fm-popup-options-change", options: options });
    }
}