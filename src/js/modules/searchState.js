//serializable class that can be passed from the background script to the content script

class SearchState
{
    constructor(_searchString)
    {
        this.searchString = _searchString;

        this.recolor();

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
        let result = new SearchState(_state.searchString);
        result.pinned = _state.pinned;
        result.caseSensitive = _state.caseSensitive;
        result.wholeWord = _state.wholeWord;
        result.primaryColor = _state.primaryColor;
        result.secondaryColor = _state.secondaryColor;
        result.tetriaryColor = _state.tetriaryColor;
        return result;
    }

    recolor()
    {
        const scheme = getRandomScheme();

        this.primaryColor = scheme.primary;
        this.secondaryColor = scheme.secondary;
        this.tetriaryColor = scheme.tetriary;
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


function hslToHex(h, s, l)
{
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n =>
    {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0'); 
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

function getRandomScheme()
{
    let result = new Object();
    let h = Math.floor(Math.random() * 360);
    const s = Math.floor(Math.random() * 40 + 40);

    result.primary = hslToHex(h, 75, 75);
    result.secondary = hslToHex(h, 60, 15);
    result.tetriary = hslToHex(h, 100, 35);
    return result;
}

export default SearchState;