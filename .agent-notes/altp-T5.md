# altp-T5 — repeat entry tile, `GtileRepeat` dimension

## Observation: lizard 1.23.0 attributes a trailing `interface` to the
preceding function's NLOC

- **Context**: Phase 1 (pure move) of `walk-repeat.ts` tripped the
  complexity hook (`hooks/check-complexity.py`) twice on newly-split
  functions that measured well under 30 NLOC by eye.
- **Finding**: `lizard -T nloc=30` (the hook's own invocation) attributes
  an `interface` block placed AFTER a function to that function's own NLOC
  count, inflating it by the interface's own line count (confirmed by
  isolated bisection in a scratch file: identical function body scores 0
  violations when the interface precedes it, 30+ NLOC when the interface
  trails it). A plain multi-line JSDoc between two functions does NOT
  trigger this — only a TS `interface`/type declaration does. The
  `lizard-length-inter-comment` memory note (from a different project)
  documents the pre-fix "length" version of this bug and claims NLOC was
  fixed; that fix does not cover the interface-trailing case in this
  lizard version.
- **Impact**: When splitting a switch-case body into a standalone walker
  module (the `walk-*-branch.ts` pattern this mission uses repeatedly),
  declare every local `interface`/type BEFORE the first function that
  uses it, never between two functions. `gtile-repeat.ts`'s own committed
  `walk-while-branch.ts` (T4) has a genuine >30-NLOC function
  (`pushWhileBack`, measures 35 in isolation) that was apparently never
  caught by the hook at write time — plausibly because the interface/JSDoc
  ordering at the time it was written didn't trigger the inflation, or the
  hook wasn't re-run after a later edit added content after it. Worth a
  `lizard -C 10 -L 30 -a 5 -T nloc=30 -w` sweep of `layout/*.ts` before
  T6 adds more content to that file, in case T6 also trips it.
- **Confidence**: High (reproduced directly, isolated the trigger with a
  minimal repro file).

## Observation: `compress/invariant.test.ts`'s pinned overlap
indices/coordinates both shift together, not just indices

- **Context**: Adding `GtileRepeat`'s entry-tile child inserted new shapes
  into `shapesOf`'s flat per-fixture list, which the invariant test pins
  by fixture+index+kind.
- **Finding**: For `boxoto-53-sifo232` the shift was a pure +1 reindex
  (same coordinates). For `tobajo-64-mipi810`'s cross-lane-arrowhead
  triple (`ALLOWED_NEW_OVERLAPS`, not `ALLOWED_HARD_OVERLAPS`), the index
  shifted (+3, 68→71 etc.) AND the coordinates moved (y: 507→591) — the
  repeat's own height grew under the jar-verbatim formula
  (`entry.h + body.h + condition.h + 96`), pushing everything below the
  repeat down. Confirmed via `git stash` + a scratch dump script (not
  committed) that isolated the pre-T5 vs post-T5 values before updating
  the pin. Do not assume "index shifted" implies "coordinates unchanged" —
  verify both independently.
- **Impact**: Relevant to T6, which will change the repeat's back-edge
  shape/side (D5) — expect this invariant test's pinned indices/
  coordinates to move again and require the same direct-dump verification
  before re-pinning, not a guessed reindex.
- **Confidence**: High (measured, not assumed).
