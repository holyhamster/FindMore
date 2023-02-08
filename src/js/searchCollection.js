import SearchState from './modules/searchState.js';

class SearchCollection
{
    searches;

    constructor(_base)
    {
        if (_base)
        {
            this.searches = _base.searches;
        }
        this.searches = [];
    }

    static new(_base)
    {
        return new this(_base);
    }

    isEquals(_state)
    {
        if (_state.length != this.searches.length)
            return false;

        for (let i = 0; i < _state.searches.length; i++)
        {
            if (!_state.searches[i].isEquals(this.searches[i]))
                return false;
        }

        return true;
    }

    addNewState()
    {
        this.searches.push(new SearchState(""));
        return this.searches[this.searches.length - 1];
    }
    delete(_search)
    {
        let newSearches = [];
        for (let i = 0; i < this.searches.length; i++)
        {
            if (this.searches[i] != _search)
                newSearches.push(this.searches[i]);
        }
        this.searches = newSearches;
    }
}

export default SearchCollection;