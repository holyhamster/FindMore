import { Colors } from "./colors";

//applied once to document's adopted sheet and all iframes individually
export const SharedHighlightCSS =
    `fm-container { 
        all:initial; 
        --color-0-hsl: ${Colors[0].highlight};
        --color-1-hsl: ${Colors[1].highlight};
        --color-2-hsl: ${Colors[2].highlight};
        --color-3-hsl: ${Colors[3].highlight};
        --color-4-hsl: ${Colors[4].highlight};
        --color-5-hsl: ${Colors[5].highlight};
        --color-6-hsl: ${Colors[6].highlight};
        --color-7-hsl: ${Colors[7].highlight};
        --color-8-hsl: ${Colors[8].highlight};
        --color-accented-hsl: ${Colors.accent};
         position: relative; 
        display: inline-block;
        width:0px; 
        height: 0px;
    }

    fm-highlight {
        position: absolute;
        opacity: 0.45;
        z-index: 2147483646;
        pointer-events: none;
    }`;

//applied for each different search to document's adopted sheet and all iframes individually
export function GetPersonalHighlightCSS(id: number, colorIndex: number, opacity: string) {
    return `fm-highlight.fm-${id} {
            background-color: hsl(var(--color-${colorIndex}-hsl) / 1);
            ${opacity ? ('opacity: ' + opacity + ';'): ""}
        }
        fm-highlight.fm-${id}.fm-accented {
            background-color: hsl(var(--color-accented-hsl)); 
        }`;
}

//applied as inline to individual search panel
export function GetPanelColorCSS(colorIndex: number) {
    return `
        --color1-hsl: var(--light-color-${colorIndex}-hsl);
        --color2-hsl: var(--dark-color-${colorIndex}-hsl);`;
}