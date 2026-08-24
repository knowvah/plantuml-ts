## Observation: `weightedScore` is not comparable across a change that GROWS our document

- **Context**: `dispatch-by-parse-attempt` batch 4. T13 ported ~40 missing
  sequence commands; the sequence diff-baseline ratchet then failed on 421
  fixtures, 242 of which render (the other 179 error).
- **Finding**: `compareNodes`' three short-circuits charge
  `units(actual) + units(expected)` (`compare.ts:198,229,404`), where `units`
  is a node's own size plus its attributes plus its children. That makes
  `weightedScore` monotone in alignment **for a fixed pair of documents** —
  descending can never cost more than stopping, which is what
  `sequence-root-chrome` D5 designed it for. It does NOT make scores
  comparable across time when *our* side changes size: the same "still
  mismatched" verdict costs strictly more once `units(actual)` grows.
- **Worked example**, `sequence/bexoce-95-vibe195`. Baseline 622, live 950,
  and the entire delta is one diff:
  - base: `svg/g[1][childCount] actual=14 expected=59`, weight 618
  - head: `svg/g[1][childCount] actual=60 expected=59`, weight 946
  We went from emitting 14 of the golden's 59 children to emitting 60 — off by
  one instead of by 45 — and the score rose by 328. The other four diffs are
  unchanged, weight 1 each.
- **Measured across all 242 risers** (each rendered at the pre-mission base
  `1aec6731` and at HEAD, both compared with the HEAD comparator):

  | child count vs the golden | n | share of total rise |
  |---|---|---|
  | moved CLOSER | 162 | 98.6% (79% excluding the `zudize-61-vomi445` outlier, +234232 alone) |
  | moved FURTHER — genuine regressions | 35 | 0.5% |
  | gap unchanged | 22 | 0.4% |
  | no top-level childCount short-circuit | 23 | 0.6% |

  The childCount diff accounts for a **median 100%** of each fixture's rise.
- **Impact**: the ratchet's header states "a rise has no benign reading left".
  That is true of the quantity it gates within one comparison and false across
  a mission that makes the port emit content it previously dropped. Re-pinning
  these 162 is correct and is not "hiding a regression"; the 35 are the real
  finding and were invisible underneath them.
- **Ruled out**: T13's *rendering* work as the driver — reverting
  `renderer.ts`, `renderer-arrowhead.ts`, `sequence-layout-events.ts` and
  `layout.ts` alone recovers 22 of 421. T13 as blameless — reverting all of
  `src/diagrams/sequence` gives risen=0. The orchestrator's own changes
  (skinparam stack, allowmixing gate, container keyword) — risen=0 with T13
  reverted while those were still in place.
- **Confidence**: High. Whole-population measurement, not a sample.

## Observation: `scale` is emitted as a transform group; the jar bakes it into coordinates

- **Context**: same diagnosis. 10 of the 35 genuine regressions collapse to
  ONE top-level child, and 11 of the 35 use `scale`.
- **Finding**: T13 renders `scale N` as
  `<g transform="scale(N)">…</g>` around unscaled coordinates
  (`sequence/renderer.ts:476-487`). The jar emits no transform group at all —
  `sequence/gebeki-18-muci858`'s golden (source: `scale 2`) carries
  pre-multiplied fractional coordinates (`M66.938,102 L372.1,102`) and
  document dimensions 454x364. Ours emits `x1="70"` inside the wrapper, with
  dimensions 606x502.
- **Impact**: two defects, not one. The extra `<g>` level collapses the
  top-level child count to 1, which maximises the short-circuit charge and
  makes these the worst-scoring fixtures in the set; and the dimensions are
  independently wrong. `scale` needs to scale coordinates and dimensions at
  emission, as upstream does, not wrap them.
- **Confidence**: High — golden and our output read side by side.
