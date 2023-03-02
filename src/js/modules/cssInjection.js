//for a direct css injection
const ShadowrootCSS = `
#TFBarsContainer {
    --scale-ratio: 2;
    --themeAlpha: .95;
    font-family: Verdana, sans-serif;
    color: var(--secondary-color);
    font-size: calc(var(--scale-ratio) * 15px);
    left: 0px;
    top: 0px;
    position: fixed;
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    align-content: flex-start;
    align-items: flex-start;
    justify-content: flex-start;
    gap: calc(var(--scale-ratio) * 5px);
    z-index: 2147483647;
    max-height: 100vh;
    max-width: 100vw;
    pointer-events: none;
}

.TFSearchBar {
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    align-content: flex-start;
    flex-wrap: wrap;
    padding: calc(var(--scale-ratio) * .2em);
    min-width: calc(var(--scale-ratio) * 180px);
    min-height: calc(var(--scale-ratio) * 30px);
    border-radius: calc(var(--scale-ratio) * 5px);
    border-style: solid;
    border-width: calc(var(--scale-ratio) * 5px);
    border-color: transparent;
    background-color: var(--primary-color);
    color: var(--secondary-color);
    --themeHue: 0;
    --primary-color: hsl(var(--themeHue), 75%, 75%, var(--themeAlpha));
    --secondary-color: hsl(var(--themeHue), 60%, 15%, var(--themeAlpha));
    pointer-events: auto;
}
.TFSearchBarBG {
    position:absolute;
    height: 100%;
    width: 100%;
    background-color:black;
    left:0px;
    top:0px;
}
.TFSearchBarRow {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.TFSearchBarRow > *:hover
{
    --themeAlpha: 1;
}
.pinned {
    border-color: var(--secondary-color);
}

button {
    border-radius: calc(var(--scale-ratio) * 20px);
    font-size: calc(var(--scale-ratio) * 15px);
    color:var(--secondary-color);
    background-color: transparent;
    border-style: none;
    margin-left: calc(var(--scale-ratio) * 5px);
    min-width: calc(var(--scale-ratio) * 24px);
    min-height:calc(var(--scale-ratio) * 24px);
    text-align: center;
    line-height: calc(var(--scale-ratio) * 15px);
}

button:hover {
    color: hsla(var(--themeHue), 75%, 75%, var(--themeAlpha));
    background-color: hsla(var(--themeHue), 60%, 15%, var(--themeAlpha));
}
.searchInput {
    color: hsl(var(--themeHue), 60%, 15%, 1);
    background-color: hsla(0, 0%, 100%, var(--themeAlpha));
    border-radius: calc(var(--scale-ratio) * 5px);
    font-size: calc(var(--scale-ratio) * 15px);
}
.caseCheck, .wordCheck {
    accent-color: hsl(0, 100%, 100%, var(--themeAlpha));
}
.upButton {
    margin-left: 0px;
    margin-right: auto;
}

span {
    user-select: none;
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

.wordCheck {
    margin-left: calc(var(--scale-ratio) * 10px);
}
`

export default ShadowrootCSS;