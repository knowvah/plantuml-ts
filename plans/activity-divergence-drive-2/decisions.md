# Architecture decisions: add2 (approved 2026-10-02, "approve all")

Scope answers (planning Phases 2-6): merge port first; parser gaps in scope as
one family; a narrow klimt exception for exactly two fixes.

## D1: the connector-merge model is ported 1:1, pre-compression, per scope
The jar draws every activity connector as a `Snake` through `UGraphicForSnake`
(`svek/UGraphicForSnake.java`), which keeps a list of `PendingSnake`s: each new
snake is merged into the first pending one it touches (`PendingSnake.merge` →
`Snake.merge`, `activitydiagram3/ftile/Snake.java:303-327`, end-to-start within
0.001, `same()`), and at flush every snake whose last point touches another's
first point loses its end decoration (`removeEndDecorationIfTouches`, unless
`cannotBeTouched()`). `Worm.merge` joins the point lists per strategy. Scopes:
`Swimlanes.drawU` wraps the whole diagram, and `FtileGroup` opens a nested
`UGraphicForSnake` — snakes never merge across a group boundary. Merging runs on
raw (pre-compression) coordinates; compression then transforms the merged
points. Port: new pure module `layout/snake-merge.ts` over the ordered edge list
(our draw order = Java draw order, T2a/T3a of add1), invoked before
`compressGeometry`. Renderer, compression shapes and canvas ink read the merged
edges. Texts: a snake whose OTHER side carries text never merges (`Snake.merge`).

## D2: `ActivityEdgeGeo.mergeable` carries the Java `MergeStrategy`
`MergeStrategy` FULL < LIMITED < NONE, `max` of the pair (`MergeStrategy.java:
38-46`); NONE never merges; LIMITED merges but `Worm.merge(…, LIMITED)` keeps the
corner; only FULL can be touched. Default FULL (`Snake.create`,
`Snake.java:140-153`). Overrides exist only in `FtileIfDown`, `FtileIfWithLinks`,
`FtileIfLongHorizontal`, `FtileWhile` (21 LIMITED + 3 NONE `withMerge` calls);
the four `Gtile*`/`GConnection*` sites are dead (`Gtile.USE_GTILE = false`,
`gtile/Gtile.java:47`). Each assignment in our walkers carries its `file:line`.

## D3: T1a maps every Java connection before any edit
Before T1b edits code, T1a writes `measurements/connection-census.md`: every
`Connection*`/`Snake` creation under `activitydiagram3/ftile/**` (live path only),
its strategy, whether it carries text/emphasize/decorations, and our push site
(`file:line`), plus oracle mini-renders of each merge case (fusion, end-decoration
drop, LIMITED corner, NONE). A Java connection with no counterpart in our walkers
is stop 12.

## D4: measurement carried from add1, plus a harness-parity gate
Golden ratchet, `pin-goldens.mts`, close procedure, all-engine survey carry over.
T0b adds `activity.harness-parity.test.ts`: `renderSync` and
`renderFixtureActivity` are byte-identical on every chrome-bearing activity
fixture and a stratified sample (add1 row 52; memory
`conformance-harness-mirrors-index-ts`). Red = stop 15.

## D5: drive cohort is ws ≤ 150
Remaining weight sits above add1's 100 line (≤ 100 holds 13% of Σ). Batch 3's
cohort = un-pinned `baseline` rows with ws ≤ 150 at the b2 close; families from
add1's open rows plus what the merge reveals.

## D6: the 38 `error` rows are in scope
Each refusal is diagnosed against the Java `Command*3` regex that accepts the
line (quote it); no lenient catch-all, no swallowing. A row that starts
rendering is promoted via `scripts/repin-activity-promote.ts` and reported.

## D7: `weightedScore` is gated; zero UNEXPLAINED rises
Over un-pinned `baseline` rows. Known reveal classes: an attribute added inside
a short-circuited subtree; a points/d list whose length now equals the jar's; a
corrected order re-pairing elements; an element count now EQUAL to the jar's
switching `compareSvg` from LCS to positional (add1 rows 12, 21, 34, 46).

## D8: klimt exception — exactly two edits
`src/core/klimt/document-shell.ts` stops hardcoding `preserveAspectRatio="none"`
(the value comes from the skinparam/pragma path the Java reads — quote it), and
`src/core/klimt/creole/command/CommandCreoleUrl.ts` gains the Java regex's
boundary after `{tooltip}`. Each with an all-engine survey before/after; any
other klimt edit is stop 8.

## D9: one style path (add1 D9)
Colours, thicknesses, fonts through `activity-style-defaults.ts`; a new key gets
a core skinparam handler + theme field, surveyed across all engines.

## D10: exit bar
- Every `fixtures.md` row has a `final` ∈ `pinned (<tag>)`, `open -> add3 (<mechanism>)`.
- Four gates green, collected = on-disk; golden ratchet and harness-parity green.
- 0 conformant losses in any engine (b0 → final); 0 unexplained rises.
- **≥ 100 activity fixtures pinned; Σ ≤ 20000.** A miss is acceptable only when
  every short row is mechanised.

## D11: execution rules
add1's worktree rules plus: no Serena MCP tools at all (read included); no
`git stash`; scratch files carry the task ID; orchestrator checks `git status` on
main before every merge; merge commit at close; never push.
