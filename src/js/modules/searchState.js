class SearchState {
  constructor(_base)
  {
    this.open = _base.open || false;
    this.searchString = _base.searchString || "";

  }
  static new(_base) {
    return new this(_base);
  }

  getRegexpOptions()
  {
    return "i";
  }
}

export default SearchState;