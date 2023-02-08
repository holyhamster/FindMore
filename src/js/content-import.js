//allows import keyword for content-main
(async () => {
    const src = chrome.runtime.getURL('src/js/content-main.js');

    const contentScript = await import(src);
    contentScript.main();
})();