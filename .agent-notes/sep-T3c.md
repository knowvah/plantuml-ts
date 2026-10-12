# sep-T3c: complex salt factories

## Observation: some `{` headers are claimed by no root factory
- **Context**: jar `ready()` matrix over every header form (`tests/unit/salt/factory/fixtures/complex-factories.json`).
- **Finding**: `{^` + `N=` (Pyramid declines a border position, Border has no `{^` in its list, ElementFactoryBorder.java:94), `{+T` and `{#T#` (Pyramid declines the tree marker, Tree requires a bare `{`, ElementFactoryTree.java:114), and `{s`/`{si` (the tokeniser splits them case-insensitively but Scroll's `equals` is case-sensitive, ElementFactoryScroll.java:74) are `false` for all six factories. At the root this is `PSystemSalt#createElement`'s `IllegalArgumentException`; inside a container it is `getNextElement`'s `IllegalStateException`. `{` + `C=` is a PYRAMID (Border's regex is `[NSEW]=`, no `C`).
- **Impact**: T4 must surface these as the jar's crash, not pick a "nearest" factory.
- **Confidence**: High

## Observation: Border dispatches on the position token's first char only
- **Context**: `ElementFactoryBorder#create` (java:66-87).
- **Finding**: `pos.charAt(0)` — `Wxyz` sets the west, `Cool` the center (jar probe `border-first-char`); any other first char throws `IllegalStateException` with no message.
- **Confidence**: High

## Observation: a raw `{ … }` group as a tree row's FIRST cell is a jar crash
- **Context**: `ElementFactoryTree#create` depth counter (java:79-104).
- **Finding**: `{T` / `{ a | b }` / `}`: the raw `{` raises depth to 1, `a`/`b` go through `getNextElement`, then the group's `}` is offered to `getNextElement` (takeMe is false) and no factory is ready: `IllegalStateException: }` (probe `tree-raw-group-first-cell`). Only a NEWLINE-terminated raw `}` first cell decrements depth (`tree-raw-brace-rows`).
- **Confidence**: High

## Observation: factory behaviour can be probed through the jar classes with reflection
- **Context**: pinning element trees built by the factories without an SVG render.
- **Finding**: `tests/unit/salt/factory/fixtures/ComplexFactoryProbe.java` wires the jar's factories as `PSystemSalt#createElement` does (subset: complex six + `ElementFactoryText`) and dumps the built element by reading private fields (`positions1`, `entries`, `north`, …) with `setAccessible`; the TS field names are the Java names, so `complex-factory-support.ts#dump` reads the same fields and the dumps compare as strings. Preferred dimensions match exactly (no tolerance). T3a/T3b factories can be added to both wirings by appending to the scenario file.
- **Confidence**: High
