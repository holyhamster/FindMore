//shell script to allow imports in javascript pages
(async () => {
    const src = chrome.runtime.getURL('src/js/content-main.js');

    const contentScript = await import(src);
    contentScript.main();
})();