//javascript css injection
//#160925 #4a0423 #6e4c5d #002d47 #003333 #1a3445 #920000 #753b00 #0a5c0a
export const ShadowrootCSS = `
#TFBarsContainer {
    --dark-color-0-hsl: 268 61% 9%;
    --dark-color-1-hsl: 333 90% 15%;
    --dark-color-2-hsl: 330 18% 20%;
    --dark-color-3-hsl: 202 100% 9%;
    --dark-color-4-hsl: 180 100% 10%;
    --dark-color-5-hsl: 204 45% 19%;
    --dark-color-6-hsl: 0 100% 15%;
    --dark-color-7-hsl: 30 100% 23%;
    --dark-color-8-hsl: 120 80% 20%;

    --light-color-0-hsl: 270 100% 71%;
    --light-color-1-hsl: 330 100% 58%;
    --light-color-2-hsl: 330 100% 86%;
    --light-color-3-hsl: 225 100% 64%;
    --light-color-4-hsl: 180 100% 33%;
    --light-color-5-hsl: 208 100% 77%;
    --light-color-6-hsl: 0 95% 71%;
    --light-color-7-hsl: 22 100% 77%;
    --light-color-8-hsl: 120 100% 57%;

    --scale-ratio: 1;
    --themeAlpha: .95;
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

.TFSearchBar {
    --color1-hsl: var(--light-color-0-hsl);
    --color2-hsl: var(--dark-color-0-hsl);

    --color1: hsl(var(--color1-hsl) / var(--themeAlpha));
    --color2: hsl(var(--color2-hsl) / var(--themeAlpha));

    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    align-content: flex-start;
    flex-wrap: wrap;
    padding: calc(var(--scale-ratio) * 1px);
    min-width: calc(var(--scale-ratio) * 180px);
    min-height: calc(var(--scale-ratio) * 30px);
    border-radius: calc(var(--scale-ratio) * 5px);
    border-style: solid;
    border-width: calc(var(--scale-ratio) * 5px);
    border-color: transparent;
    background-color: var(--color1);
    color: var(--color2);
    
    
    pointer-events: auto;
    user-select: none;
}

.TFSearchBar > div {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.TFSearchBar:hover
{
    --color1: hsl(var(--color2-hsl) / 1);
    --color2: hsl(var(--color1-hsl) / 1);
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
}
.caseCheck, .wordCheck {
    accent-color: hsl(0, 100%, 100%, var(--themeAlpha));
}
.wordCheck {
    margin-left: calc(var(--scale-ratio) * 10px);
}
.upButton {
    margin-left: 0px;
    margin-right: auto;
}

.selectedMatch {
    right: 0px;
    min-width: calc(var(--scale-ratio) * 40px);
    display:flex;
    justify-content:flex-end;
}
.totalMatches {
    left: 0px;
    min-width: calc(var(--scale-ratio) * 40px);
}

label 
{
    left: 0px;
}

.wordLabel
{
    margin-right: auto;
}
`

export const DefaultHighlightCSS =
    `fm-container { 
        all:initial; 
        --color-0-hsl: 270 100% 71%;
        --color-1-hsl: 330 100% 58%;
        --color-2-hsl: 330 100% 86%;
        --color-3-hsl: 228 100% 43%;
        --color-4-hsl: 180 100% 29%;
        --color-5-hsl: 204 100% 71%;
        --color-6-hsl: 0 96% 51%;
        --color-7-hsl: 32 72% 50%;
        --color-8-hsl: 120 100% 57%;
        --color-accented-hsl: 60 100% 55%;
        position: absolute; 
    }
    fm-container.fm-relative { 
        position: relative; 
        display:inline-block; 
        width:0px; 
        height: 0px; 
    }
    fm-highlight {
        all:initial;
        position:
        absolute;
        opacity: 0.6;
        z-index: 2147483646;
    }`; //` pointer-events: none;`;

export function GetPersonalCSS(id, colorIndex, opacity)
{
    return `fm-highlight.fm-${id} {
        --test: test;
            background-color: hsl(var(--color-${colorIndex}-hsl) / ${opacity}); 
        }
        fm-highlight.fm-${id}.fm-accented {
            background-color: hsl(var(--color-accented-hsl) / ${opacity}); 
        }`;
}