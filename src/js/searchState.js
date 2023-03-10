//serializable class that's passed between background and content script 

class SearchState
{
    constructor(_searchString, _colorHue)
    {
        this.searchString = _searchString;
        this.hue = isNaN(_colorHue) ? Math.floor(Math.random() * 360) : _colorHue;
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
        const result = new SearchState(_state.searchString, _state.hue);
        result.pinned = _state.pinned;
        result.caseSensitive = _state.caseSensitive;
        result.wholeWord = _state.wholeWord;
        return result;
    }
    recolor(_forward)
    {
        this.hue += _forward ? 25 : -25;

        const to = `"tolIndigo": "#332288",
            "tolGreen": "#117733",
                "tolTeal": "#44aa99",
                    "tolCyan": "#88ccee",
                        "tolSand": "#ddcc77",
                            "tolRose": "#cc6677",
                                "tolPurple": "#aa4499",
                                    "tolWine": "#882255"`;
    }

    getColor()
    {
        return hslToHex(this.hue, 75, 75);
    }

    getDarkColor()
    {
        return hslToHex(this.hue, 60, 15);
    }

    getAccentedColor()
    {
        return hslToHex(this.hue, 100, 35);
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


function hslToHex(h, s, l)
{
    while (h < 0 || h > 360)
        h -= Math.sign(h) * 360
    s = Math.max(0, Math.min(s, 100));
    l = Math.max(0, Math.min(l, 100));

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
export default SearchState;