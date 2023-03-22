import { GetOptionsChangeEvent } from './search.js'
import { rootCSS } from './cssStyling/cssInjection.js';

//Singleton that parents all in-page UI. Has the following structure:
//Document.body -> <fm-shadowholder> with DOMShadow -> <div> with css -> <div> holding all search panels
//listenes to option change events to adjust css

export class Root {
    constructor() {
        let shadowHolder = document.getElementsByTagName("fm-shadowholder")[0];
        if (!shadowHolder) {
            shadowHolder = document.createElement("fm-shadowholder");
            this.appendSelf(shadowHolder);
        }

        const shadow = shadowHolder.attachShadow({ mode: "closed" });

        const css = document.createElement("div");
        css.style = "all: initial";
        css.innerHTML = `<style>${rootCSS}</style>`;
        shadow.appendChild(css);

        const root = document.createElement("div");
        root.setAttribute("id", `FMPanelContainer`);
        root.addEventListener(GetOptionsChangeEvent().type,
            (args) => {
                Object.assign(root.style, convertOptionsToStyle(args?.options));
                Root.getLocalEventRoots().forEach((panel) => {
                    panel.dispatchEvent(GetOptionsChangeEvent(args?.options));
                });
            });

        css.appendChild(root);
        return root;
    }
    appendSelf(shadowHolder) {
        if (document.body)
            document.body.appendChild(shadowHolder);
        else
            setTimeout(() => this.appendSelf(shadowHolder), 1);
    }
    static instance;
    static Get() {
        if (!Root.instance)
            Root.instance = new Root();

        return Root.instance;
    }

    static getLocalEventRoots() {
        return Array.from(Root.Get().getElementsByClassName(`FMPanel`));
    }
}

function convertOptionsToStyle(options) {
    const style = new Object();

    const screenGap = "5px";
    style.top = options?.StartTop ? screenGap : "";
    style.bottom = options?.StartTop ? "" : screenGap;
    style.left = options?.StartLeft ? screenGap : "";
    style.right = options?.StartLeft ? "" : screenGap;

    if (options.Horizontal) {
        style.flexDirection = options?.StartLeft ? "row" : "row-reverse";
        style.flexWrap = options?.StartTop ? "wrap" : "wrap-reverse";
    }
    else {
        style.flexDirection = options?.StartTop ? "column" : "column-reverse";
        style.flexWrap = options?.StartLeft ? "wrap" : "wrap-reverse";
    }

    Object.defineProperty(style, "--themeAlpha", { value: (isNaN(options?.MenuOpacity) ? .95 : options.MenuOpacity) });
    Object.defineProperty(style, "--scale-ratio", { value: (isNaN(options?.MenuScale) ? 1 : options.MenuScale) });

    return style;
}