import { rootCSS } from './cssStyling/cssInjection.js';

//Singleton that holds all in-page UI. 
//Has the following structure:
//  Document.body -> 
//  fm-shadowholder with a closed shadow node -> 
//  css div that resets page's style and adds its own -> 
//  root div holding all search panels
//Listenes to option change events to adjust style accordingly

export class Root {
    static build() {
        let shadowHolder = document.getElementsByTagName("fm-shadowholder")[0];
        if (!shadowHolder) {
            shadowHolder = document.createElement("fm-shadowholder");
            Root.append(shadowHolder);
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
                Root.GetLocalEventRoots().forEach((panel) => {
                    panel.dispatchEvent(GetOptionsChangeEvent(args?.options));
                });
            });

        css.appendChild(root);
        return root;
    }

    //if the document body isn't accessible at the time, wait and try again
    static append(shadowHolder) {
        if (document.body)
            document.body.appendChild(shadowHolder);
        else
            setTimeout(() => Root.append(shadowHolder), 5);
    }

    static instance;
    static Get() {
        if (!Root.instance)
            Root.instance = Root.build();
        return Root.instance;
    }

    static GetLocalEventRoots() {
        return Array.from(Root.Get().getElementsByClassName(`FMPanel`));
    }
}

//reads Options() from popup script and applies it to style object
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

export function GetOptionsChangeEvent(options) {
    const event = new Event("fm-options-change");
    event.options = options;
    return event;
}