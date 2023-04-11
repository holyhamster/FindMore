import { State } from "../content/search/state";

test('Try to escape with regex symbols', () => {
    let state: State = new State("/[A-Z][a-z]*(?:\s[A-Z][a-z]*)*/");
    expect(state.GetRegex()).toStrictEqual(/\/\[A-Z\]\[a-z\]\*\(\?:s\[A-Z\]\[a-z\]\*\)\*\//gi);
});

test('Load serialized state into a full one ', () => {
    let serialized: any = { pinned: true, searchString: "penguins", colorIndex: 3 };
    let state: State = State.Load(serialized);

    expect(state.GetRegex).toBeTruthy();
    expect(state.pinned).toBe(true);
    expect(state.searchString).toStrictEqual("penguins");
    expect(state.colorIndex).toBe(3);
});