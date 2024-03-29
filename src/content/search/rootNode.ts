import { Options } from '../../options';
import { rootCSS } from './cssStyling/rootCSS';
import { OptionsChangeEmitter, OptionsChangeEvent } from './searchEvents';

//Singleton that holds all in-page UI. 
//Has the following structure:
//  Document.body -> 
//  fm-shadowholder with a closed shadow node -> 
//  css div that resets page's style and adds UI css -> 
//  root div holding all search panels
//Listenes to option change events to adjust style accordingly

export class RootNode extends HTMLDivElement implements OptionsChangeEmitter {

    private static instance: RootNode;
    static Get(): RootNode {
        RootNode.instance = RootNode.instance || RootNode.build();
        return RootNode.instance;
    }

    private static build(): RootNode {
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

        //TODO: declare root a custom element so its constructor can be used
        const root = document.createElement("div") as RootNode;
        root.emitOptionsChange = (options: Options) => {
            RootNode.GetLocalEventRoots().forEach((panel: Element) => {
                panel.dispatchEvent(new OptionsChangeEvent(options));
            });
        };

        root.setAttribute("id", `FMPanelContainer`);
        root.addEventListener(OptionsChangeEvent.type,
            (args: any) => {
                const options: Options | undefined = args?.options;
                if (!options)
                    return;
                convertOptionsToStyle(options!, root.style);
                root.emitOptionsChange(options);
            });

        css.appendChild(root);
        return root as RootNode;
    }

    emitOptionsChange(options: Options) {
        RootNode.GetLocalEventRoots().forEach((panel: Element) => {
            panel.dispatchEvent(new OptionsChangeEvent(options));
        });
    }

    //if the document body isn't accessible at the time, wait and try again
    static append(shadowHolder: Element) {
        if (document.body)
            document.body.appendChild(shadowHolder);
        else
            setTimeout(() => RootNode.append(shadowHolder), 5);
    }

    static GetLocalEventRoots(): Element[] {
        return Array.from(RootNode.Get().getElementsByClassName(`FMPanel`));
    }
}

//reads Options() from popup script and applies it to style object
function convertOptionsToStyle(options: Options, styleRef: CSSStyleDeclaration) {
    const screenGap = "5px";
    styleRef.top = options.StartTop ? screenGap : "";
    styleRef.bottom = options.StartTop ? "" : screenGap;
    styleRef.left = options.StartLeft ? screenGap : "";
    styleRef.right = options.StartLeft ? "" : screenGap;

    if (options.Horizontal) {
        styleRef.flexDirection = options.StartLeft ? "row" : "row-reverse";
        styleRef.flexWrap = options.StartTop ? "wrap" : "wrap-reverse";
    }
    else {
        styleRef.flexDirection = options.StartTop ? "column" : "column-reverse";
        styleRef.flexWrap = options.StartLeft ? "wrap" : "wrap-reverse";
    }

    styleRef.setProperty("--theme-alpha", options.MenuOpacity.toString());
    styleRef.setProperty("--scale-ratio", options.MenuScale.toString());
    return styleRef;
}

