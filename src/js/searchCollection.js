import SearchState from './modules/searchState.js';

class SearchCollection
{
    searches;

    constructor(_base)
    {
        this.searches = [];
    }

    static new()
    {
        return new this();
    }

    static load(_base, _persistentOnly)
    {
        let collection = SearchCollection.new();
        if (!_base)
            return collection;

        for (let i = 0; i < _base.searches.length; i++)
        {
            if (!_persistentOnly || _base.searches[i].pinned)
                collection.searches.push(_base.searches[i]);
        }

        return collection;
    }

    isEmpty()
    {
        return this.searches.length == 0;
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