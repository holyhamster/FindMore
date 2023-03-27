import { ColorCount } from './cssStyling/cssInjection.js'

//Holds all user-editable data about a single search
//Serialized when passed to background script for caching

export class State {
    constructor(colorIndex = 0, searchString = "") {
        this.searchString = searchString;
        this.colorIndex = colorIndex;
        this.pinned = false;
        this.caseSensitive = false;
        this.wholeWord = false;
    }

    static Load(state) {
        const result = new State();
        Object.assign(result, state);
        return result;
    }

    NextColor() {
        this.colorIndex = this.colorIndex == ColorCount - 1 ? 0 : this.colorIndex + 1;
    }

    GetRegex(escape = true) {
        let regexString = escape ? this.searchString.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
            : this.searchString;

        if (this.wholeWord)
            regexString = `\\b${regexString}\\b`;

        const regexOptions = this.caseSensitive ? "g" : "gi";
        return new RegExp(regexString, regexOptions);
    }

    IsEmpty() {
        return this.searchString == "";
    }

    //Takes array of states, returns a free colorIndex
    static GetNextColor(states) {
        if (!states || states.length == 0)
            return 0;

        const takenColors = [];
        states.forEach((state) => takenColors.push(state?.colorIndex));
        for (let colorCandidate = 0; colorCandidate < ColorCount; colorCandidate += 1)
            if (!takenColors.includes(colorCandidate))
                return colorCandidate;

        const lastUsedColor = states[states.length - 1].colorIndex;
        return lastUsedColor == ColorCount - 1 ? 0 : lastUsedColor + 1;
    }
}