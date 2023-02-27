//for a direct css injection
const ShadowrootCSS = `
#TFBarsContainer {
    --scale-ratio: 1;
    --primary-color: white;
    --secondary-color: black;
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
    pointer-events:auto;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    align-content: flex-start;
    flex-wrap: wrap;
    border-radius: calc(var(--scale-ratio) * .2em);
    min-width: calc(var(--scale-ratio) * 18em); 
    padding: calc(var(--scale-ratio) * .2em);
    min-height: calc(var(--scale-ratio) * 3em); 
    border-style: solid;
    border-width: calc(var(--scale-ratio) * .2em);
    border-color: transparent;
    opacity: 0.9;
}

.TFSearchBarRow {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.pinned {
    border-color: var(--secondary-color);
}

button {
    border-radius: 20px;
    background-color: transparent;
    border-style: none;
    color:var(--secondary-color);
    margin-left: 5px;
    min-width:24px;
    min-height:24px;
    text-align: center;
    line-height: 1em;
}

button:hover {
  color: var(--primary-color);
  background-color: var(--secondary-color);
}
.searchInput {
    color:var(--secondary-color);
    border-radius: 5px;
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
    min-width: 40px;
    display:flex;
    justify-content:flex-end;
}
.totalMatches {
    left: 0px;
    min-width: 40px;
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
    margin-left: 10px;
}
`

export default ShadowrootCSS;