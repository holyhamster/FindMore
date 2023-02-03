class SearchRegion
{
    constructor(_treeWalk, _searchString, _regexp)
    {
        this.searchString = _searchString;
        this.regex = _regexp;

        this.string = "";
        this.nodes = [];
        this.offset = 0;
        this.walk = _treeWalk;
    }

    addNext()
    {
      let newNode = this.walk.nextNode();

      if (!newNode)
        return false;

      let newLineOffset = DomSearcher.checkForNewLine(newNode);
      if (newLineOffset)
      {
        if (newLineOffset == newNode.textContent.length - 1)
        {

        }
        this.nodes = [newNode];
      }
      this.string += newNode.textContent;
      this.nodes.push(newNode);

      this.trim();

      return true;
    }

    trim()
    {
      let SEARCH_REGION_IS_UNNESESARY_LOG;
      while(SEARCH_REGION_IS_UNNESESARY_LOG = (this.nodes.length > 0 &&
        ((this.string.length) - this.nodes[0].textContent.length > this.searchString.length - 1)))
      {
        this.string = _region.string.substring(this.nodes[0].textContent.length);
        this.nodes.shift();
        this.offset = 0;
      }
    }

    trimToPoint(_nodeIndex, _offset)
    {
      this.offset = _offset;
      this.nodes = this.nodes.slice(_nodeIndex);
      this.string = "";
      for (let i = 0; i < this.nodes.length; i++)
        this.string += this.nodes[i].textContent;
    }

    getMatches(_amount)
    {

        let matches = [...this.string.substring(this.offset).matchAll(this.regexp)];
        matches = matches.splice(0, _amount);
        let previousNodesOffset = 0, j = 0;
        for (let i = 0; i < matches.length; i++)
        {
        matches[i].index += this.offset;
        let MATCH_INSIDE_I_NODE;
        while (MATCH_INSIDE_I_NODE = (previousNodesOffset + this.nodes[j].textContent.length) <= matches[i].index)
        {
            previousNodesOffset += this.nodes[j].textContent.length;
            j += 1;
        }

        matches[i].startIndex = j;
        matches[i].startOffset = matches[i].index - previousNodesOffset;

        while (MATCH_INSIDE_I_NODE = (previousNodesOffset + this.nodes[j].textContent.length < matches[i].index + this.searchString.length))
        {
            previousNodesOffset += this.nodes[j].textContent.length;
            j += 1;
        }
            matches[i].endIndex = j;
            matches[i].endOffset = matches[i].index + this.searchString.length - previousNodesOffset;
        }
        return matches;
    }
}


export default SearchRegion;