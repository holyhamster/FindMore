//serializable class that's passed between background and content script

class SearchState
{
    constructor(searchString)
    {
        this.searchString = searchString;
        this.colorIndex = 0;
        this.pinned = false;
        this.caseSensitive = false;
        this.wholeWord = false;
    }

    static load(state)
    {
        const result = new SearchState(state.searchString);
        result.colorIndex = state.colorIndex;
        result.pinned = state.pinned;
        result.caseSensitive = state.caseSensitive;
        result.wholeWord = state.wholeWord;
        return result;
    }

    nextColor()
    {
        this.colorIndex = this.colorIndex == 8 ? 0 : this.colorIndex + 1;
    }

    getRegex(_escape = true)
    {
        let regString = _escape ? this.searchString.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
            : this.searchString;

        if (this.wholeWord)
            regString = `\\b${regString}\\b`;

        const regOptions = this.caseSensitive ? "g" : "gi";
        return new RegExp(regString, regOptions);
    }

}

export default SearchState;