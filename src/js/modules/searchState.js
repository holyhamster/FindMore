//serializable class that can be passed from the background script to the content script

class SearchState
{
    searchString;

    constructor(_string)
    {
        this.searchString = _string;
    }
    static new(_string)
    {
        return new this(_string);
    }

    getRegexpOptions()
    {
        return "gi";
    }

    isEquals(_search)
    {
        return this.searchString == _search.searchString;
    }
}

export default SearchState;