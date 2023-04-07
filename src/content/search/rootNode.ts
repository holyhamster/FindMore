import { rootCSS } from './cssStyling/cssInjection';

//Singleton that holds all in-page UI. 
//Has the following structure:
//  Document.body -> 
//  fm-shadowholder with a closed shadow node -> 
//  css div that resets page's style and adds UI css -> 
//  root div holding all search panels
//Listenes to option change events to adjust style accordingly

export class RootNode extends HTMLDivElement{
  
    static build(): RootNode {
        let shadowHolder = document.getElementsByTagName("fm-shadowholder")[0];
        if (!shadowHolder) {
            shadowHolder = document.createElement("fm-shadowholder");
            RootNode.append(shadowHolder);
        }

        const shadow = shadowHolder.attachShadow({ mode: "closed" });

        const css = document.createElement("div");
        css.setAttribute("style", "all: initial");
        css.innerHTML = `<style>${rootCSS}</style>`;
        shadow.appendChild(css);

        const root = document.createElement("div");
        root.setAttribute("id", `FMPanelContainer`);
        root.addEventListener(OptionsChangeEvent.type,
            (args: any) => {
                convertOptionsToStyle(args?.options, root.style);
                RootNode.GetLocalEventRoots().forEach((panel: Element) => {
                    panel.dispatchEvent(new OptionsChangeEvent(args?.options));
                });
            });

        css.appendChild(root);
        return root as RootNode;
    }

    //if the document body isn't accessible at the time, wait and try again
    static append(shadowHolder: Element) {
        if (document.body)
            document.body.appendChild(shadowHolder);
        else
            setTimeout(() => RootNode.append(shadowHolder), 5);
    }

    static instance: RootNode;
    static Get(): RootNode {
        if (!RootNode.instance)
            RootNode.instance = RootNode.build();
        return RootNode.instance;
    }

    static GetLocalEventRoots(): Element[] {
        return Array.from(RootNode.Get().getElementsByClassName(`FMPanel`));
    }
}

//reads Options() from popup script and applies it to style object
function convertOptionsToStyle(options: any, styleRef: CSSStyleDeclaration) {
    const screenGap = "5px";
    styleRef.top = options?.StartTop ? screenGap : "";
    styleRef.bottom = options?.StartTop ? "" : screenGap;
    styleRef.left = options?.StartLeft ? screenGap : "";
    styleRef.right = options?.StartLeft ? "" : screenGap;

    if (options?.Horizontal) {
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

export class OptionsChangeEvent extends Event {
    static readonly type: string = "fm-options-change";
    constructor(public options: any) {
        super(OptionsChangeEvent.type);
    }
}
