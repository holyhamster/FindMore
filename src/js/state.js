//holds all user-editable data about a single search
//serialized to pass between content and background script

export class State
{
    constructor(searchString)
    {
        this.searchString = searchString;
        this.colorIndex = 0;
        this.pinned = false;
        this.caseSensitive = false;
        this.wholeWord = false;
    }

    static Load(state)
    {
        const result = new State(state.searchString);
        result.colorIndex = state.colorIndex;
        result.pinned = state.pinned;
        result.caseSensitive = state.caseSensitive;
        result.wholeWord = state.wholeWord;
        return result;
    }

    NextColor()
    {
        this.colorIndex = this.colorIndex == 8 ? 0 : this.colorIndex + 1;
    }

    GetRegex(escape = true)
    {
        let regString = escape ? this.searchString.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
            : this.searchString;

        if (this.wholeWord)
            regString = `\\b${regString}\\b`;

        const regOptions = this.caseSensitive ? "g" : "gi";
        return new RegExp(regString, regOptions);
    }

    IsEmpty() {
        return this.searchString == "";
    }
}