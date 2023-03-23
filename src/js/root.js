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
                convertOptionsToStyle(args?.options, root.style);
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

function convertOptionsToStyle(options, styleRef) {
    const screenGap = "5px";
    styleRef.top = options?.StartTop ? screenGap : "";
    styleRef.bottom = options?.StartTop ? "" : screenGap;
    styleRef.left = options?.StartLeft ? screenGap : "";
    styleRef.right = options?.StartLeft ? "" : screenGap;

    if (options.Horizontal) {
        styleRef.flexDirection = options?.StartLeft ? "row" : "row-reverse";
        styleRef.flexWrap = options?.StartTop ? "wrap" : "wrap-reverse";
    }
    else {
        styleRef.flexDirection = options?.StartTop ? "column" : "column-reverse";
        styleRef.flexWrap = options?.StartLeft ? "wrap" : "wrap-reverse";
    }

    styleRef.setProperty("--theme-alpha", isNaN(options?.MenuOpacity) ? .95 : options.MenuOpacity);
    styleRef.setProperty("--scale-ratio", isNaN(options?.MenuScale) ? 1 : options.MenuScale);
    return styleRef;
}