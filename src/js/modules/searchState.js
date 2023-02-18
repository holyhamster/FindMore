//serializable class that can be passed from the background script to the content script

class SearchState
{
    constructor(_searchString, _color)
    {
        this.searchString = _searchString;
        this.color = _color;

        if (!this.color)
            this.color = getRandomColor();

        this.pinned = false;
        this.caseSensitive = false;
        this.wholeWord = false;
    }

    static new(_string, _color)
    {
        return new this(_string, _color);
    }

    static load(_state)
    {
        let result = new SearchState(_state.searchString, _state.color);
        result.pinned = _state.pinned;
        result.caseSensitive = _state.caseSensitive;
        result.wholeWord = _state.wholeWord;
        return result;
    }

    getRegex(_escape = true)
    {
        let regString = _escape ? this.searchString.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
            : this.searchString;

        if (this.wholeWord)
            regString = '\b' + regString + '\b';

        let regOptions = this.caseSensitive ? "g" : "gi";

        return new RegExp(regString, regOptions);
    }
}



function getRandomColor()
{
    return "#" + Math.floor(Math.random() * 16777215).toString(16);
}

export default SearchState;