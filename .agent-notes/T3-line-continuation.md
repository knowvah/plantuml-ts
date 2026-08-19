## Observation: harness-diff GREW row is pre-existing, not T3's
- **Context**: T3 (state-declared-size-fix) ran the mandated
  `harness-diff.py` gate against `test-results/state-declared-size-baseline.jsonl`.
- **Finding**: `fovafu-44-mifu394` scope2 height GREW
  (-10.594224 -> -11.996136 px) in the diff. Isolated via `git stash` of all
  five T3-owned files and re-running the harness: the GREW value is
  IDENTICAL with or without T3's change. `oracle/goldens/state/size-backlog.json`'s
  own `_doc` field documents this exact number as landed by a concurrent
  sibling task (T5's G10 re-pin, 2026-08-18): fixing a dotted-leaf-display
  bug narrowed fovafu-44's leaf, which improves its width but widens its
  height via `measureAutonomWrapper`'s recursive dependency on the leaf.
  `test-results/state-declared-size-baseline.jsonl` (T0's pinned harness
  baseline) is simply stale relative to that already-committed, already
  ratchet-documented change — a cross-task baseline staleness, not a T3 defect.
- **Impact**: future tasks running `harness-diff.py` against this same
  baseline file will see the same false GREW entry for fovafu-44 until
  someone re-pins `state-declared-size-baseline.jsonl` (which D4 restricts
  to "re-pin downward only after 0 rows appeared or grew" — a chicken/egg
  a later task or the orchestrator needs to resolve, e.g. by re-pinning
  specifically the fovafu-44 row with T5's own justification attached).
- **Confidence**: High (isolated by stash + rerun; matches size-backlog.json's own documented account).

## Observation: duzazu-41/vixobo-14 width residual is a separate mechanism from G3
- **Context**: T3 ported `ReadFilterMergeLines`; SI28's `composite-a.md`/
  `composite-b.md` findings attributed BOTH the width (-14px) and height
  (-28px) deltas on duzazu-41/vixobo-14 to the single missing-merge
  mechanism (G3).
- **Finding**: after the merge lands, HEIGHT is byte-exact on both
  fixtures; WIDTH is unchanged to the pre-fix value, bit-for-bit. Verified
  via a direct probe of `buildBlockUmls`'s output: the merged
  `Active: SEND_MSG (msg, mailbox) / \n\t HAL_CAN_AbortTxRequest(...) \n\t
  HAL_CAN_AddTxMessage(...)` line is byte-identical in shape to the
  already-correct `entry`/`exit` lines. `state-composite-sizing.ts#
  measureAutonomWrapper` computes `mergedWidth = Math.max(text.width,
  attr.width, childImg.width)` via the SAME `measureLines`/
  `splitStateDisplayLines` pipeline `state-sizing.ts` uses for entry/exit
  (both already correct) — yet the composite's declared width doesn't
  move. This is the same class of gap as fibudu-53-bode309's already-
  identified `#b` residual (`measureAutonomWrapper`'s width computation),
  not a defect in the merge itself, and out of T3's write-set
  (`state-sizing.ts`/`state-composite-sizing.ts`).
- **Impact**: the ratchet entries for duzazu-41/vixobo-14 were TIGHTENED
  (0.311805->0.194444in, 0.388889->0.194444in) rather than removed. The
  residual mirrors fibudu-53#b and likely closes with the same follow-on
  fix (T6 / F1's creole-text seam).
- **Confidence**: High (isolated by direct content probe of the join
  output plus manifest DOT/SVG hash comparison against a siblings-only
  baseline).
