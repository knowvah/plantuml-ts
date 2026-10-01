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

## Observation: node-dispatch.ts corrupts every single-line `backward:LABEL;`
- **Context**: Orchestrator push-forward extended T3h's write-set to
  `tile-layout.ts` to wire the seam above. After wiring, 15 of 19 backward
  corpus fixtures regressed (weighted score rose) and 2 improved -- NOT a
  geometry defect in the new wiring.
- **Finding**: `node-dispatch.ts#parseNodes` (`:475-482`) strips a trailing
  `;` off any line that does not start with `:`, written for bare
  control-flow keywords (`start;`, `endif;`) but guarded ONLY by
  `!line.startsWith(':')` -- which `backward:LABEL;` also satisfies. After
  the strip, `RE_BACKWARD` (`dispatch-support.ts:67`, requires a literal
  `;`) fails to match; `tryBackward` (`list-backward-dispatch.ts:37-52`)
  falls through to its multiline branch (`RE_BACKWARD_HEAD` + `readMulti
  lineActionBody`), which reads `ctx.lines` RAW (unaffected by the strip,
  since that mutates a local `line` variable, never `ctx.lines` itself)
  and swallows every subsequent source line -- the repeat/while's own
  closer (`repeat while (...)`/`endwhile`), any lane-closer, and any
  trailing top-level node (e.g. `stop`) -- into the backward label, until
  it finds a RAW line that happens to end in `;` (which can be an
  UNRELATED line, as in `debofa-60-mude568`'s second `backward:` line,
  whose own `;` accidentally looks like a valid closer one line early) or
  reaches EOF. Net effect: the swallowed `stop`/closer nodes are entirely
  ABSENT from the AST (confirmed: `kemedu-83-vipa115`'s rendered SVG has
  no stop ellipse at all), and the repeat/while's own `condition`/
  `yesLabel`/`outLabel` are lost (`condition: ""` for every affected
  fixture). Verified directly: parsed the AST for `kemedu-83-vipa115`,
  `xizola-97-sizu458`, `niviji-21-maco613`, `debofa-60-mude568`,
  `liteza-62-nopo771` (5 fixtures, repeat and while, single- and
  multi-line forms, with and without swimlanes) and traced the exact
  regex/stripping interaction by hand; also confirmed `liteza`'s SECOND
  repeat loop (a genuinely multiline `backward:`) parses its own
  `condition` correctly, isolating the trigger to the single-line form
  specifically.
- **Impact**: This is a PRE-EXISTING defect (both `node-dispatch.ts` and
  `dispatch-support.ts` are untouched by every commit on this branch) that
  has silently affected EVERY corpus fixture using `backward:LABEL;` on
  one line, since before this mission started -- invisible until now only
  because `backward`'s tile was always dropped. It very likely affects
  ANY OTHER `keyword:content;` construct sharing this port's dispatch
  convention (not investigated further -- scope creep beyond T3h). Did
  NOT re-pin any of the 15 risers/2 fallers this exposed (would freeze a
  known-corrupted parse into the goldens, D7/`weightedscore-can-rise-on-
  a-correct-fix`). `node-dispatch.ts` is outside every write-set granted
  to this branch so far.
- **Confidence**: High -- root-caused by reading `node-dispatch.ts:461-
  496` directly (not inferred from the diff), reproduced the exact
  swallow chain by hand for 5 fixtures, and confirmed the fix location
  with a standalone regex test isolating the single variable (strip vs.
  no-strip).
