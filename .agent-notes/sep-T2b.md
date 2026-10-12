# sep-T2b: salt menus and tabs

## Observation: the jar's popup draw order is nondeterministic
- **Context**: porting `ElementMenuBar#drawU` z-index 1 (ElementMenuBar.java:123), which iterates `popups.entrySet()`.
- **Finding**: `popups` is a `HashMap<ElementMenuEntry, ElementMenuPopup>` (java:54); `ElementMenuEntry` does not override `hashCode`, so keys hash by identity. Four renders of the same `menu-bar-popups.puml` through `scripts/oracle-render.sh` drew the three popups in three different orders (Source/Edit/File, File/Source/Edit, Source/Edit/File, Source/File/Edit). The port iterates a `Map` in insertion order, one of the orders the jar produces.
- **Impact**: any salt row with two or more `{*` popups can differ from its cached oracle in `<rect>`/`<text>` order only, and a re-render of the oracle can flip it. Conformance on such a row needs an order-insensitive comparison of the popup groups, or it is flaky against the jar itself. Corpus rows with one popup each (`firuta`, `xetajo`, `fokigi`, `zereco`, `ributi`) are not affected.
- **Confidence**: High

## Observation: a bare `{*` or `{/` at the root is a jar crash
- **Context**: probing a menu bar alone (`@startsalt` / `{* File | Edit }` / `@endsalt`).
- **Finding**: `PSystemSalt#createElement` (PSystemSalt.java:215) throws `IllegalArgumentException`: only pyramid, scroll, border and tree are root candidates (java:191-198). A probe for a single widget must wrap it in `{ … }`, which puts the cell at (6, 6) with dimension preferred + 1 (ElementPyramid.java:113-116, 139, 146).
- **Impact**: the fixtures under `tests/unit/salt/element/fixtures/{menu-bar,tab}-*.puml` are all wrapped this way; `menu-tab-test-support.ts#drawInCell` reproduces the cell placement.
- **Confidence**: High

## Observation: `setBackground(getColorBB())` never shows in a jar render
- **Context**: `ElementMenuBar.java:119-120` marks every popup owner `#BBB` at z-index 1.
- **Finding**: the entry is drawn at z-index 0 only, before z-index 1 runs (PSystemSalt.java:120-121), so no cached oracle has a `#BBB` rect. The port keeps the call; a test shows the rects appear only when z-index 0 is drawn a second time.
- **Confidence**: High
