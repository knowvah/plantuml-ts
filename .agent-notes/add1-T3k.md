# T3k — diamond own-label draw order

## Observation: shared node `kind` strings are a cross-task contract
- **Context**: Splitting the hexagon polygon from its own-label text
  (`FtileDiamondInside#drawU`'s five separate calls) required changing
  what `renderNode`'s `'if-split'`/`'while-header'` cases draw.
- **Finding**: Two producers of these SAME kind strings existed outside
  this task's write-set and outside the T3k spec's own file list:
  `walk-if-with-links.ts` (never sets north/south, so its own combined
  push was already order-correct) and `tile-coordinates.ts`'s
  `'gtile-diamond'` case (the switch condition, a `GtileDiamond` with no
  side-label slots at all). A first attempt introduced a brand-new kind
  (`'if-shape'`) to avoid touching those files, but `canvas-origin.ts`'s
  `POLYGON_X_KINDS`/`fudgeX` (forbidden file, owned by a parallel task)
  keys on the literal kind STRING — a new kind silently lost the ±10px
  polygon ink fudge, regressing canvas-origin-dependent geometry across
  ~60 corpus fixtures (full-corpus aggregate 31968→35133, worse than
  doing nothing). Reverting to reuse the ORIGINAL kind strings for the
  polygon-only push (and adding a companion `'if-own-label'` push to the
  two other producers instead) fixed it: 31968→31523.
- **Impact**: Before changing what an EXISTING node kind renders, grep
  every producer of that kind string project-wide — not just the
  producers your own task's write-set lists. A dispatcher-level render
  change is a cross-cutting contract change, same severity as an API
  signature change.
- **Confidence**: High (reproduced both ways, full-corpus measured).

## Observation: `GtileDiamond` (plain) vs `GtileDiamondInside` (hexagon-with-labels)
- **Context**: `tile-coordinates.ts`'s `'gtile-diamond'` case serves
  `GtileDiamond` (switch condition/merge, `tile-layout.ts:321,326`) — a
  DIFFERENT, simpler class from `GtileDiamondInside` (if/while/repeat).
- **Finding**: `GtileDiamond` has only a single `label` field, no
  north/south/west/east slots (`tiles/gtile-diamond.ts`). Java's real
  `FtileDiamond.java` DOES have north/south/west/east slots but NO own
  label field at all — this port's `GtileDiamond`/`renderDiamond` is
  already a known simplification (one central label, no side labels),
  pre-existing and out of T3k's scope.
- **Impact**: Future diamond-order work should not assume `GtileDiamond`
  mirrors `FtileDiamond` 1:1; it is closer to a merge of upstream's
  `FtileDiamond` (shape) and `FtileDiamondInside` (one label) than either
  individually.
- **Confidence**: High (read both Java classes directly).

## Observation: pre-existing empty repeat-condition label (nested/backward repeats)
- **Context**: `geremo-94-tecu179` (repeat + backward + repeat-while) and
  `katopo-68-xajo866` (nested repeat/repeat-while, no is/not clause) both
  render their `repeat-cond` hexagon with an EMPTY own label, even though
  the jar draws real text ("Something wrong?", "test 1"/"test 2").
- **Finding**: Confirmed PRE-EXISTING on the unmodified parent commit
  (371cc8b64) via a `git worktree add --detach` at that commit — not
  something T3k introduced. T3k's own fix (skip pushing `'if-own-label'`
  when the label is genuinely `''`) is correct per-se, but it removes an
  EMPTY `<text>` element the OLD combined-push code drew unconditionally
  (`renderHexagon` never guarded on empty), which happened to reduce a
  positional-pairing mismatch. Removing it is more upstream-faithful
  (Java never draws a UText at all for a genuinely absent label slot) but
  raises `geremo-94-tecu179`'s weightedScore (163→254) since the TRUE
  root cause — the condition text not threading into `GtileDiamondInside`
  at all for these two constructions — is untouched.
- **Impact**: A follow-on mission should trace why `repeat`'s own
  condition label is lost specifically when `backward:` is present or
  when `repeat while(cond)` has no `is`/`not` clause — likely in
  `tile-layout.ts`'s repeat-condition construction or
  `tile-layout-backward.ts`, not in any walker.
- **Confidence**: High (confirmed empty on both before/after; confirmed
  jar renders real text via `scripts/oracle-render.sh`).

## Observation: `shapesOf`'s compression-slot coverage and new node kinds
- **Context**: Adding `'if-own-label'` as a genuinely separate node (not
  baked into the hexagon's own box) requires `compress/shapes-of.ts` to
  map it to a `CompressShape`, or `compress/invariant.test.ts`'s stop-11
  gate (no NEW hard shape overlap from compression) fails — the DEFAULT
  `rect` fallback is geometrically harmless (same box as the containing
  polygon) but is NOT what upstream's real `SlotFinder` would compute for
  a `UText` (no X/Y fudge, baseline-origin convention), and omitting the
  mapping produced 9 new flagged overlaps across 3 fixtures.
- **Impact**: Any task that splits a combined node into two separately-
  rendered nodes must also update `shapes-of.ts`'s `shapeForNode`
  dispatch, not just the renderer — the compression pass and the
  renderer must agree on what occupies space.
- **Confidence**: High (reproduced the overlap regression and the fix).
