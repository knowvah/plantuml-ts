## Observation: spot/label/goto real geometry, two newly-exposed residuals
- **Context**: T2g (add2-T2g), giving `(X)`/`#color:(X)`/`label NAME`/
  `goto NAME` real AST nodes + tiles (T2e had consumed them with no
  node, D6 follow-on), plus the embedded-diagram-as-image construct.
- **Finding 1**: `FtileCircleSpot` is a FIXED 20x20 circle (`SIZE = 20`,
  `FtileCircleSpot.java:60`), never widened by the character's own
  measured width (the regex only ever captures one char). A prior
  half-port (`gtile-spot.ts`, commit `6b453d8bc`) widened it using
  `CONNECTOR_SPOT_RADIUS = 8` (diameter 16) + measured text — an
  unsourced guess, now orphaned in `activity-layout-constants.ts:51`
  (not deleted: that file is outside this task's write-set).
- **Finding 2**: `FtileLabel`/`FtileGoto` both extend `FtileEmpty` with
  no `drawU` override (draws nothing) and zero width/height. Verified
  empirically, not just read: `start; label X; :A; stop;` renders
  BYTE-IDENTICAL to the same diagram with `label X;` deleted.
  `start;:A;goto X;:B;stop;` renders `B` exactly 10px lower than with
  `goto X;` deleted, with NO connecting line filling that 10px gap —
  `FtileGoto.calculateDimensionFtile().withoutPointOut()`'s "no out
  point" already has a GENERIC consumer in this codebase
  (`tile-coordinates.ts#pushTopDownSiblingEdge`'s `if
  (!prevChild.hasPointOut()) return`, already live for `kill`/
  `detach` via `tile-layout.ts#withKilled`) — no new mechanism needed,
  confirmed by `nipuxu-11-tefa314`'s own `(A); detach;` row already
  using it correctly.
- **Finding 3 (real bug, fixed)**: `tile-coordinates.ts`'s pre-existing
  `'gtile-spot'` case never forwarded `color` onto the pushed
  `ActivityNodeGeo` — `vilecu-41-tete416`'s two inline-coloured spots
  (`#blue:(B)`, `#green:(G)`) rendered the default fill instead.
- **Finding 4 (real bug, fixed)**: `label`/`goto`'s zero-size
  `ActivityNodeGeo` fell through `shapes-of.ts#shapeForNode`'s generic
  rect-box fallback (not in `NO_SHAPE_KINDS`), producing a
  zero-width/height box `Slot`'s constructor rejects
  (`IllegalArgumentException: start=X end=X`) — reproduced directly on
  `getene-72-dido571`/`kiceze-91-luke737`. Fixed by adding both kinds
  to `NO_SHAPE_KINDS` (same treatment as `break`, which also draws
  nothing). `shapes-of.ts` is outside this task's nominal write-set
  (`layout/compress/**`) but the fix was unavoidable and is a single,
  isolated, well-cited one-line addition.
- **Finding 5 (residual, named, not fixed)**: `zaloze-31-jibo311`
  (`if/else` where the else branch is `(A); detach;`) scores 137
  post-fix (was 166 pre-T2g). Root cause traced to
  `conditional-builder.ts#buildIfDown`'s `hasTwoBranches =
  thenTile.hasPointOut() && elseTile.hasPointOut()`: BEFORE this task,
  `(A)` produced no tile, so the else branch was an EMPTY
  `GtileTopDown([])`, whose `hasPointOut()` is unconditionally `true`
  (`GtileTopDown.java`'s own doc, "an empty sequence always has an out
  point") — giving `hasTwoBranches = true`. AFTER this task, the else
  branch is a real, killed spot tile (`hasPointOut() === false`,
  Java-correct — the Java `InstructionList` for this branch really is
  `[FtileKilled(FtileCircleSpot)]`, not empty), flipping
  `hasTwoBranches` to `false` for the first time on any baseline
  fixture. `GtileIfDown`'s own geometry for `hasTwoBranches === false`
  then draws 4 extra elements shifted ~22px — a LATENT, pre-existing
  bug in `conditional-builder.ts`/`gtile-if-down.ts` (T2c's domain,
  outside this task's write-set), newly reachable because this task's
  spot/detach construct is the first baseline fixture to produce a
  real `hasPointOut() === false` branch alongside a `true` one via
  THIS exact if-builder. Not touched; reported for a follow-on mission
  that owns the if-builder family.
- **Finding 6 (residual, named, not fixed)**: `getene-72-dido571`
  scores 8 (one `<line>`'s `y1`/`y2` swapped vs the jar). The jar's
  compress wrapper (`UGraphicCompressOnXorY#drawLine`) unconditionally
  normalizes every line to `y1 <= y2`; this port only applies that
  normalization at a handful of individually-cited call sites
  (`activity-renderer-terminals.ts#orderedLine`, the end-cross
  diagonals) — general `Worm`-drawn edges in `renderer.ts
  #renderEdgeSegments` do not. This task's zero-cost `label` fix
  changes which direction this one backward-connector edge draws in,
  newly exposing the gap. Generalizing `orderedLine` to every edge is
  a broad, corpus-wide change (`core/klimt/**`-adjacent) well outside
  this task's blast radius; reported, not attempted.
- **Finding 7 (deferred, named, not attempted)**: the embedded-diagram
  construct (`mufixi-71-koma752`/`pufuzi-99-vone170`) is UNCHANGED at
  235/70 (confirmed via a detached merge-base worktree: identical
  scores before and after this task's other work). The jar's own
  oracle SVG for both rows embeds a FULLY recursively-rendered nested
  SVG as a base64 `<image>` (verified by decoding the base64 —
  `pufuzi`'s embed is a complete `start;:L1;stop;` sub-diagram, NOT a
  42x42 placeholder; the "42x42 reserved" memory note is upstream's
  OWN catch-fallback size for a renderer FAILURE, not a universal
  deterministic-text behavior). This repo already has the exact
  reusable infrastructure (`core/EmbeddedDiagram.ts`'s
  `NestedDiagramRenderer` seam, `class/class-nested-diagram-
  renderer.ts#createNestedDiagramRenderer`'s strip-PI/measure/base64/
  depth-guard logic, `core/nested-diagram-registry.ts`'s registration
  slot) — but wiring it for activity requires: (1) an
  `ActivityAction.label` shape change from plain `string` to a
  text/embed sequence (the embed can sit mid-label, alongside literal
  text lines before/after it, confirmed on `mufixi`'s own two-level
  nesting); (2) editing `gtile-action.ts` (box sizing, shared by every
  action in every fixture) to size the box around the embed's
  rendered dimensions; (3) editing `activity-renderer-text.ts`/
  `activity-renderer-shapes.ts` to draw the `<image>`; (4) a new
  activity-scoped nested-diagram-renderer file + a registration call
  in `src/index.ts`. Items 2-4 are outside this task's write-set, and
  item 2 alone has corpus-wide blast radius (every action box). This
  is "genuinely large AND separable" by CLAUDE.md's own test — named
  as a follow-on mission, not attempted half-finished.
- **Impact**: 5 of 7 rows measurably improved (nipuxu 60->18, vilecu
  76->18, getene 157->8, kiceze 214->0 exact, zaloze 166->137); 2
  unchanged (mufixi 235, pufuzi 70, deferred per Finding 7). 0 movement
  on any of the 231 pinned/baseline rows (verified via a detached
  merge-base-commit worktree: identical crash/riser/faller set before
  and after). `jupoxe-15-sugo110`'s snake-merge axis-drift crash is
  confirmed pre-existing at the SAME merge-base commit (T2h's own fix
  for it, `f66e82d62`, is on the shared mission branch but not yet in
  this branch) — not introduced by this task.
- **Confidence**: High (every claim verified by direct render/measure,
  not read-only reasoning; the before/after comparisons used a
  detached worktree at this branch's own merge-base commit, isolating
  from concurrent sibling-agent merges on the shared mission branch).
