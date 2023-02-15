//serializable class that can be passed from the background script to the content script

class SearchState
{
    searchString;
    regexpOptions;
    constructor(_string, _color)
    {
        this.searchString = _string;
        this.pinned = false;
        this.caseSensitive = false;
        this.wholeWord = false;
        this.regexpOptions = "gi";
        this.color = _color;
        if (!this.color)
            this.color = getRandomColor()
    }
    static new(_string)
    {
        return new this(_string);
    }

    isEquals(_search)
    {
        return this.searchString == _search.searchString;
    }
}

function getRandomColor()
{
    return "#" + Math.floor(Math.random() * 16777215).toString(16);
}

export default SearchState;