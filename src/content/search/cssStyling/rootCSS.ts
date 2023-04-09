import { Colors } from "./colors"

//applied to root UI element
export const rootCSS = `
#FMPanelContainer {
    --dark-color-0-hsl: ${Colors[0].dark};
    --dark-color-1-hsl: ${Colors[1].dark};
    --dark-color-2-hsl: ${Colors[2].dark};
    --dark-color-3-hsl: ${Colors[3].dark};
    --dark-color-4-hsl: ${Colors[4].dark};
    --dark-color-5-hsl: ${Colors[5].dark};
    --dark-color-6-hsl: ${Colors[6].dark};
    --dark-color-7-hsl: ${Colors[7].dark};
    --dark-color-8-hsl: ${Colors[8].dark};

    --light-color-0-hsl: ${Colors[0].light};
    --light-color-1-hsl: ${Colors[1].light};
    --light-color-2-hsl: ${Colors[2].light};
    --light-color-3-hsl: ${Colors[3].light};
    --light-color-4-hsl: ${Colors[4].light};
    --light-color-5-hsl: ${Colors[5].light};
    --light-color-6-hsl: ${Colors[6].light};
    --light-color-7-hsl: ${Colors[7].light};
    --light-color-8-hsl: ${Colors[8].light};
    
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
    border: calc(var(--scale-ratio) * 4px) solid hsl(${Colors.accent});
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