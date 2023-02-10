import DOMSearcher from './domSearcher.js';

const TFSearchBarID = "TFSearchBar";
const TFInputBarID = "TFInputBar";

class SearchBar
{
    id;

    mainDiv;
    inputBar;
    progressLabel;
    closeButton;
    upButton;
    downButton;

    searchState;
    searcherRef;

    onClose;
    onSearchChange;

    highlightCSS;

    color;

    selectedIndex;

    constructor(_id, _state, _order, _color)
    {
        
        document.addEventListener(`TF-match-updates-${this.id}`, function (e)
        {
            this.progressLabel.textContent = e.matches.length;
        })
        this.id = _id;
        this.searchState = _state;

        this.color = _color;
        if (!this.color)
        {
            this.color = this.getRandomColor();
        }

        this.onClose = new Event("TF-bar-closed");
        this.onClose.id = this.id;

        this.onSearchChange = new Event("TF-search-changed");
        this.onSearchChange.id = this.id;

        this.highlightCSS = new CSSStyleSheet();
        this.highlightCSS.replaceSync(
            `.TFH${this.id} { background-color: ${this.color}; opacity: 0.4; z-index: 147483647;}
            .TFHS${this.id} { border: 5px solid ${invertHex(this.color) }; padding: 0px;}
            .TFSB${this.id} { background-color: ${this.color} }`);
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, this.highlightCSS];

        this.constructHtml();
        this.setPosition(_order);
        this.updateLabels();
        if (this.searchState && this.searchState.searchString != "")
            this.startSearcher();
        
    }

    getRandomColor()
    {
        return "#" + Math.floor(Math.random() * 16777215).toString(16);
    }

    setPosition(_order)
    {
        this.mainDiv.style.top = (_order * 70) + 10 + "px";
    }
    
    constructHtml()
    {
        this.closeButton = document.createElement("button");
        this.closeButton.innerHTML = 'x';
        this.closeButton.onclick = function () { this.close(); }.bind(this);
        this.closeButton.style.marginLeft = 'auto';

        this.upButton = document.createElement("button");
        this.upButton.innerHTML = '^';
        this.upButton.onclick = function () { this.previousMatch(); }.bind(this);
        this.upButton.style.marginLeft = 'auto';

        this.downButton = document.createElement("button");
        this.downButton.innerHTML = 'v';
        this.downButton.onclick = function () { this.nextMatch(); }.bind(this);
        this.downButton.style.marginLeft = 'auto';

        this.progressLabel = document.createElement("span");
        this.progressLabel.textContent = `0`;
        this.progressLabel.minWidth = '100px';
        //this.progressLabel.style.float = 'right';
        this.progressLabel.style.marginLeft = 'auto';

        this.inputBar = document.createElement("input");
        //this.inputBar.setAttribute("id", TFInputBarID)
        this.inputBar.setAttribute("value", this.searchState.searchString);

        this.inputBar.addEventListener("input", function (e)
        {
            if (this.searcherRef)
            {
                this.removeHighlights();
                this.searcherRef.interrupt();
            }

            this.searchState.searchString = e.target.value;
            this.selectedIndex = null;
            if (e.target.value != "")
            {
                this.startSearcher();
            }

            document.dispatchEvent(this.onSearchChange);
        }.bind(this));


        this.mainDiv = document.createElement("div");
        this.mainDiv.setAttribute("class", `TFSearchBar TFSB${this.id}`);
        this.mainDiv.style.display = 'flex';
        this.mainDiv.style.top = "10px";
        this.mainDiv.style.right = "10px";
        this.mainDiv.style.minWidth = "300px";
        this.mainDiv.style.padding = "10px";
        this.mainDiv.style.zIndex = 147483647;

        this.mainDiv.appendChild(this.inputBar);
        this.mainDiv.appendChild(this.progressLabel);
        this.mainDiv.appendChild(this.downButton);
        this.mainDiv.appendChild(this.upButton);
        this.mainDiv.appendChild(this.closeButton);

        document.body.appendChild(this.mainDiv);

        this.inputBar.focus();
    }

    close()
    {
        document.dispatchEvent(this.onClose);
        if (this.searcherRef)
        {
            this.searcherRef.interrupt();
            document.removeEventListener(`TF-matches-update${this.id}`, this.updateLabels);
        }

        this.removeHighlights();

        if (document.adoptedStyleSheets.includes(this.highlightCSS))
        {
            let sheets = [];
            for (let i = 0; i < document.adoptedStyleSheets.length; i++)
                if (document.adoptedStyleSheets[i] != this.highlightCSS)
                    sheets.push(document.adoptedStyleSheets[i])

            document.adoptedStyleSheets = sheets;
        }

        this.mainDiv.remove();
    }
    previousMatch()
    {
        if (!this.searcherRef || this.searcherRef.getMatches().length == 0)
            return;

        if (this.selectedIndex == null)
            this.selectedIndex = 0;
        else
            this.selectedIndex -= 1;

        if (this.selectedIndex < 0)
            this.selectedIndex = this.searcherRef.getMatches().length - 1;

        this.searcherRef.selectHighlight(this.selectedIndex);
        this.updateLabels()
    }
    nextMatch()
    {
        if (!this.searcherRef || this.searcherRef.getMatches().length == 0)
            return;

        if (this.selectedIndex == null)
        {
            this.selectedIndex = 0;
        }
        else
        {
            this.selectedIndex += 1;
        }

        if (this.selectedIndex >= this.searcherRef.getMatches().length)
        {
            this.selectedIndex = 0;
        }

        this.searcherRef.selectHighlight(this.selectedIndex);
        this.updateLabels()
    }
    startSearcher()
    {
        this.searcherRef = new DOMSearcher(this.id,
            this.searchState.searchString, this.searchState.getRegexpOptions());
        document.addEventListener(`TF-matches-update${this.id}`, this.updateLabels.bind(this));
    }

    updateLabels()
    {
        if (this.selectedIndex == null && this.searcherRef?.getMatches().length > 0)
        {
            this.selectedIndex = 0;
            this.searcherRef.selectHighlight(this.selectedIndex);
        }

        const labelText = (this.selectedIndex == null ? '0' : (this.selectedIndex + 1)) + `/` + 
            (this.searcherRef == null ? 0 : this.searcherRef.getMatches().length);
        this.progressLabel.innerHTML = labelText;
    }

    removeHighlights()
    {
        let highlights = document.querySelectorAll(`.TFC${this.id}`);

        for (let i = 0; i < highlights.length; i++)
        {
            highlights[i].remove();
        }
    }
    
}

function invertHex(_hex)
{
    let color = _hex + "";
    color = color.substring(1); // remove #
    color = parseInt(color, 16); // convert to integer
    color = 0xFFFFFF ^ color; // invert three bytes
    color = color.toString(16); // convert to hex
    color = ("000000" + color).slice(-6); // pad with leading zeros
    color = "#" + color; // prepend #
    return color;
}

export default SearchBar;