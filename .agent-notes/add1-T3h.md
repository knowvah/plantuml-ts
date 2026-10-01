## Observation: backward's whole wiring lives in tile-layout.ts, not T3h's write-set
- **Context**: Porting `FtileRepeat`/`FtileWhile`'s optional `backward`
  activity (journal rows 24, 34; `gtile-repeat.ts`'s own doc claimed
  "0 fixtures", false).
- **Finding**: `backward:LABEL;` parses into an `ActivityBackward` AST node
  (`kind: 'backward'`) that lands INLINE in the repeat/while body's own
  node list (`ast.ts`/`list-backward-dispatch.ts`) -- a structural
  divergence from the jar, where `ActivityDiagram3#backward` (`:377-391`)
  pulls it OFF the current `InstructionRepeat`/`InstructionWhile` as a
  separate field (`setBackward`) and it never becomes a body element at
  all. On our side, `tile-layout.ts`'s `NULL_RESULT_KINDS` set (`'backward'`
  included) makes `tileNode` return `null` for it, so the label/swimlane
  info is dropped entirely before any `GtileRepeat`/`GtileWhile` is built.
  `tileRepeat`/`tileWhile` (both in `tile-layout.ts`, T3c's write-set) are
  the ONLY place that could intercept the node (mirroring the existing
  `kill`/`detach` interception in `tileNodes`), build its tile (a synthetic
  `ActivityAction` through `GtileAction`, same as `factory.activity(...)`),
  decide `backwardExitsOnLeft` (`FtileRepeat.java:210-219`, a swimlane-order
  comparison -- also only derivable in `tile-layout.ts`, which has
  `laneOrder`), and pass it through to the tile constructors.
- **Impact**: T3h ported the full downstream capability (`GtileRepeat`/
  `GtileWhile` accept an optional `backward` child; `walk-repeat.ts`/
  `walk-while-branch.ts` draw it + `ConnectionBackBackward1/2`, replacing
  `Simple`/`Complex` when set) and pinned it with direct unit tests that
  construct the tiles by hand, bypassing `tile-layout.ts`. But since no
  production call site passes a `backward` argument yet, all 19 corpus
  fixtures using `backward:` measured BYTE-IDENTICAL before/after (Σ 46762
  both ways, confirmed via `activity-probe.ts --json` over all 256 baseline
  rows, 0 risers/0 fallers, repin dry-run 0 changes). A follow-on task
  needs `tile-layout.ts`'s write-set extended (or a new task) to: (a)
  intercept `'backward'` in `tileRepeat`/`tileWhile`'s own body-walking,
  (b) build its tile, (c) compute `backwardExitsOnLeft`, (d) pass it to
  `new GtileRepeat(..., { ..., backward })` / `new GtileWhile(..., backward)`.
- **Confidence**: High -- traced via `grep` across `tile-layout.ts`,
  `node-dispatch.ts`, `ast.ts`, `InstructionRepeat.java`,
  `InstructionWhile.java`, `ActivityDiagram3.java`, and confirmed by the
  0-movement measurement above.
