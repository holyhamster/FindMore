import { DOMCrawler } from "../content/search/domCrawling/domCrawler";
import { Match } from "../content/search/match";
import { State } from "../content/search/state";
import { mockHTML } from "./mockhtml";

document.documentElement.innerHTML = mockHTML;

test('Look through document for a match', () => {

    jest.useFakeTimers();
    let matches: Match[] = [];
    var state = new State("search_phrase", 1);
    new DOMCrawler(state.searchString,
        state.GetRegex(),
        document.createElement('div'),
        (newMatches: Match[]) => matches = [...matches, ...newMatches]);

    jest.advanceTimersByTime(100);
    expect(matches.length).toBe(1);
});

test