import { ColorCount } from './cssStyling/colors'

//Holds all user-editable data about a single search
//Serialized when passed to background script for caching

export class State {
    public pinned = false;
    public caseSensitive = false;
    public wholeWord = false;
    constructor(public searchString = "", public colorIndex = 0) {
    }

    static Load(state: State): State {
        return Object.assign(new State(), state);
    }

    NextColor(): void {
        this.colorIndex = (this.colorIndex < ColorCount - 1) ? this.colorIndex + 1 : 0;
    }

    GetRegex(escape = true): RegExp {
        let regexString = escape ?
            this.searchString.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") :
            this.searchString;

        if (this.wholeWord)
            regexString = `\\b${regexString}\\b`;

        const regexOptions = this.caseSensitive ? "g" : "gi";
        return new RegExp(regexString, regexOptions);
    }

    IsEmpty(): boolean {
        return this.searchString == "";
    }

    //Takes array of states, returns a free colorIndex 
    //if none are free, return next color after the latest
    static GetNextColor(states: State[]): number {
        if (!states || states.length == 0)
            return 0;

        const takenColors: number[] = [];
        states.forEach((state: State) => takenColors.push(state.colorIndex));
        for (let colorCandidate = 0; colorCandidate < ColorCount; colorCandidate += 1)
            if (!takenColors.includes(colorCandidate))
                return colorCandidate;

        const lastUsedColor = states[states.length - 1].colorIndex;
        return lastUsedColor == ColorCount - 1 ? 0 : lastUsedColor + 1;
    }
}