import { GetOptionsChangeEvent } from './search.js'
import { ShadowrootCSS, PanelClass, PanelContainerId } from './cssStyling/cssInjection.js';

//singleton that holds all in-page UI, has the following structure:
//document -> shadowholder with DOMShadow -> css -> root parent
export class Shadowroot
{
    constructor()
    {
        let shadowHolder = document.getElementsByTagName("fm-shadowholder")[0];
        if (!shadowHolder)
        {
            shadowHolder = document.createElement("fm-shadowholder");
            document.body.appendChild(shadowHolder);
        }

        const shadow = shadowHolder.attachShadow({ mode: "closed" });
        
        const css = document.createElement("div");
        css.style = "all: initial";
        css.innerHTML = `<style>${ShadowrootCSS}</style>`;
        shadow.appendChild(css);

        const root = document.createElement("div");
        root.setAttribute("id", PanelContainerId);        
        root.addEventListener(GetOptionsChangeEvent().type,
            (args) =>
            {
                Object.assign(root.style, convertOptionsToStyle(args?.options));
                Shadowroot.getLocalEventRoots().forEach((panel) =>
                {
                    panel.dispatchEvent(GetOptionsChangeEvent(args?.options));
                });
            });

        css.appendChild(root);
        return root;
    }

    static instance;
    static Get()
    {
        if (!Shadowroot.instance)
            Shadowroot.instance = new Shadowroot();

        return Shadowroot.instance;
    }

    static getLocalEventRoots()
    {
        return Array.from(Shadowroot.Get().getElementsByClassName(PanelClass));
    }
}

function convertOptionsToStyle(options)
{
    const style = new Object();

    const screenGap = "5px";
    style.top = options?.StartTop ? screenGap : "";
    style.bottom = options?.StartTop ? "" : screenGap;
    style.left = options?.StartLeft ? screenGap : "";
    style.right = options?.StartLeft ? "" : screenGap;

    if (options.Horizontal)
    {
        style.flexDirection = options?.StartLeft ? "row" : "row-reverse";
        style.flexWrap = options?.StartTop ? "wrap" : "wrap-reverse";
    }
    else
    {
        style.flexDirection = options?.StartTop ? "column" : "column-reverse";
        style.flexWrap = options?.StartLeft ? "wrap" : "wrap-reverse";
    }

    Object.defineProperty(style, "--themeAlpha", { value: (isNaN(options?.MenuOpacity) ? .95 : options.MenuOpacity) });
    Object.defineProperty(style, "--scale-ratio", { value: (isNaN(options?.MenuScale) ? 1: options.MenuScale) });

    return style;
}