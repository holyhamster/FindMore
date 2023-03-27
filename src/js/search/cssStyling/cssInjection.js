//Strings with css for injection with content scripts

export const ColorCount = 9;
const colors = {
    accent: `60 100% 55%`, //selected highlight
    0: {
        highlight: `270 100% 71%`,  //color of the highlighted match on page
        dark: `268 61% 9%`,         //UI color for matching search panel
        light: `270 100% 71%`       //UI color for matching search panel
    }, 1: {
        highlight: `330 100% 58%`,
        dark: `333 90% 15%`,
        light: `330 100% 58%`
    }, 2: {
        highlight: `32 72% 50%`,
        dark: `30 100% 23%`,
        light: `22 100% 77%`
    }, 3: {
        highlight: `228 100% 43%`,
        dark: `202 100% 9%`,
        light: `225 100% 64%`
    }, 4: {
        highlight: `180 100% 29%`,
        dark: `180 100% 10%`,
        light: `180 100% 33%`
    }, 5: {
        highlight: `204 100% 71%`,
        dark: `204 45% 19%`,
        light: `208 100% 77%`
    }, 6: {
        highlight: `0 96% 51%`,
        dark: `0 100% 15%`,
        light: `0 95% 71%`
    }, 7: {
        highlight: `330 100% 86%`,
        dark: `330 18% 20%`,
        light: `330 100% 86%`
    }, 8: {
        highlight: `120 100% 57%`,
        dark: `120 80% 20%`,
        light: `120 100% 57%`
    }
}

//applied to root element holding UI elements
export const rootCSS = `
#FMPanelContainer {
    --dark-color-0-hsl: ${colors[0].dark};
    --dark-color-1-hsl: ${colors[1].dark};
    --dark-color-2-hsl: ${colors[2].dark};
    --dark-color-3-hsl: ${colors[3].dark};
    --dark-color-4-hsl: ${colors[4].dark};
    --dark-color-5-hsl: ${colors[5].dark};
    --dark-color-6-hsl: ${colors[6].dark};
    --dark-color-7-hsl: ${colors[7].dark};
    --dark-color-8-hsl: ${colors[8].dark};

    --light-color-0-hsl: ${colors[0].light};
    --light-color-1-hsl: ${colors[1].light};
    --light-color-2-hsl: ${colors[2].light};
    --light-color-3-hsl: ${colors[3].light};
    --light-color-4-hsl: ${colors[4].light};
    --light-color-5-hsl: ${colors[5].light};
    --light-color-6-hsl: ${colors[6].light};
    --light-color-7-hsl: ${colors[7].light};
    --light-color-8-hsl: ${colors[8].light};
    
    --scale-ratio: 1;
    --theme-alpha: .95;
    font-family: Verdana, sans-serif;
    color: var(--dark-color);
    font-size: calc(var(--scale-ratio) * 15px);
    left: 5px;
    top: 5px;
    position: fixed;
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    align-content: flex-start;
    align-items: flex-start;
    justify-content: flex-start;
    gap: calc(var(--scale-ratio) * 3px);
    z-index: 2147483647;
    max-height: 100vh;
    max-width: 100vw;
    pointer-events: none;
}

.FMPanel {
    --color1-hsl: var(--light-color-0-hsl);
    --color2-hsl: var(--dark-color-0-hsl);

    --color1: hsl(var(--color1-hsl) / var(--theme-alpha));
    --color2: hsl(var(--color2-hsl) / var(--theme-alpha));

    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    align-content: flex-start;
    flex-wrap: wrap;
    padding: calc(var(--scale-ratio) * 2px);
    min-width: calc(var(--scale-ratio) * 300px);
    min-height: calc(var(--scale-ratio) * 30px);
    border-radius: calc(var(--scale-ratio) * 5px);
    border-style: solid;
    border-width: calc(var(--scale-ratio) * 3px);
    border-color: transparent;
    background-color: var(--color1);
    color: var(--color2);
    pointer-events: auto;
    user-select: none;
}

.FMPanel > div {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.pinned {
    border-color: var(--color2);
}
button {
    border-radius: calc(var(--scale-ratio) * 20px);
    font-size: calc(var(--scale-ratio) * 15px);
    color:var(--color2);
    background-color: transparent;
    border-style: none;
    margin-left: calc(var(--scale-ratio) * 5px);
    min-width: calc(var(--scale-ratio) * 24px);
    min-height:calc(var(--scale-ratio) * 24px);
    text-align: center;
    line-height: calc(var(--scale-ratio) * 15px);
}

button:hover {
    color: var(--color1);
    background-color: var(--color2);
}
button:active {
    transform: translateY(calc(var(--scale-ratio)*1px));
    background-color: black;
}
.searchInput {
    color: black;
    background-color: white;
    border-radius: calc(var(--scale-ratio) * 5px);
    font-size: calc(var(--scale-ratio) * 15px);
    border: calc(var(--scale-ratio) * 4px) solid transparent;
}
.searchInput:focus {
    border: calc(var(--scale-ratio) * 4px) solid hsl(${colors.accent});
}

.caseCheck, .wordCheck {
    accent-color: hsl(0, 100%, 100%, var(--theme-alpha));
}
.wordCheck {
    margin-left: calc(var(--scale-ratio) * 10px);
}
.downButton {
    margin-left: 0px;
    margin-right: auto;
}

.selectedMatch {
    right: 0px;
    min-width: calc(var(--scale-ratio) * 50px);
    display:flex;
    justify-content:flex-end;
}
.totalMatches {
    left: 0px;
    min-width: calc(var(--scale-ratio) * 50px);
}

label 
{
    left: 0px;
}

.wordLabel
{
    margin-right: auto;
}`

//applied once to document's adopted sheet and all iframes individually
export const SharedHighlightCSS =
    `fm-container { 
        all:initial; 
        --color-0-hsl: ${colors[0].highlight};
        --color-1-hsl: ${colors[1].highlight};
        --color-2-hsl: ${colors[2].highlight};
        --color-3-hsl: ${colors[3].highlight};
        --color-4-hsl: ${colors[4].highlight};
        --color-5-hsl: ${colors[5].highlight};
        --color-6-hsl: ${colors[6].highlight};
        --color-7-hsl: ${colors[7].highlight};
        --color-8-hsl: ${colors[8].highlight};
        --color-accented-hsl: ${colors.accent};
        position: absolute; 
        display: flex;
    }
    fm-container.fm-relative { 
        position: relative; 
        display:inline-block; 
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
export function GetPersonalHighlightCSS(id, colorIndex, opacity) {
    return `fm-highlight.fm-${id} {
            background-color: hsl(var(--color-${colorIndex}-hsl) / 1);
            ${opacity ? ('opacity: ' + opacity + ';'): ""}
        }
        fm-highlight.fm-${id}.fm-accented {
            background-color: hsl(var(--color-accented-hsl)); 
        }`;
}

//applied as inline to individual search panel
export function GetPanelColorCSS(colorIndex) {
    return `
        --color1-hsl: var(--light-color-${colorIndex}-hsl);
        --color2-hsl: var(--dark-color-${colorIndex}-hsl);`;
}