//Shell script that allows imports in subsequent pages
(async () => {
    const src = chrome.runtime.getURL('src/js/content-main.js');

    const contentScript = await import(src);
    contentScript.main();
})();