import { FrameWalker } from "../content/search/domCrawling/frameWalker";
import { mockHTML } from "./mockhtml";

document.documentElement.innerHTML = mockHTML;

test('Count iframes', () => {
    
    let fn = jest.fn();
    let walker = new FrameWalker(document.body, () => fn());
    while (walker.NextNode()) {  }
    expect(fn).toBeCalledTimes(1);
})