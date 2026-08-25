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

## Resolution: the scale defect is fixed; the metric artefact is not a defect

- **Fixed** (`fix(T13)`, 2026-08-24): `scale` now multiplies the geometry and
  the theme at the layout->render boundary (`sequence/scale-geo.ts`, mirroring
  `json/scale-geo.ts`), and emits no transform. Jar-verified with
  `scripts/oracle-render.sh`: `scale 2` doubles dimensions and font sizes and
  emits zero transforms; `scale 3` triples them.
- **Effect, measured over the 1140 baselined fixtures**: risers 242 -> 217,
  genuinely-less-aligned 35 -> 25, fallers 36 -> 46, ratchet failures
  421 -> 396. Zero fixtures rose. All ten single-child collapses recovered;
  `caxuke-64-femu351` now matches the golden's child count exactly.
- **Still open**: 217 risers, of which 162 have a child count CLOSER to the
  golden than before the mission — those are the metric artefact and should be
  re-pinned, not "fixed". The 25 that moved further and the 12 with no
  childCount short-circuit are the remaining real work, and they have no
  single shared mechanism.

## Resolution 2: two primitive-decomposition defects, 12 of the 25 closed

The 25 "genuine regressions" were never T13 emitting things the jar lacks.
Every one over-emitted, and the cause was that this port DECOMPOSES two shapes
into more SVG primitives than the jar does. T13 only made it visible, by
rendering enough of each diagram for the per-construct excess to push the total
past the golden's.

- **Actor stick man** (`fix(T13)`, 2026-08-25): emitted `<circle>` + FOUR
  `<line>`s where `ActorStickMan#drawU` (`ActorStickMan.java:73,77-85,91,95`)
  builds ONE `UEllipse` and ONE `UPath` of four moveTo/lineTo pairs -- five
  top-level children against the jar's two, per actor row, and both the header
  and footer rows draw one. Corpus effect: risers 217 -> 42, fallers 46 -> 151.
- **Note fold** (`fix(T13)`, 2026-08-25): `noteBox` drew the dog-ear as TWO
  `<line>`s where `Opale#getCorner` (`Opale.java:134-147`) builds ONE closed
  `UPath` -- three children per note against the jar's two. Shared by the
  activity, files and sequence engines; the description and state parity gates
  were measured unchanged (11 and 23). Corpus effect: fallers 151 -> 258.

**Net: 12 of the 25 closed. 13 remain**, plus 19 other risers (32 total).
Ratchet failures 234 -> 211.

### The compensating-error class, and why 11 fixtures were re-pinned

Both fixes made eleven fixtures RISE, and each is the same thing: the spurious
extra child had been making our top-level count coincidentally EQUAL the
golden's, so the comparator descended and charged 55-112 real diffs. With the
shape corrected the count is honestly short, one short-circuit replaces the
descent, and the score goes up while every emitted element is strictly closer
to upstream. Verified element-for-element against each golden, not asserted.

**Two real deficits this unmasked**, both worth their own work:
- no `<image>` is rendered for an `<img:...>` inside note text
  (`fifasu-62-pipo979`);
- the autonumber is emitted as part of the message label where the jar emits a
  separate `<text>` beside it (`kituzo-58-vari147`).

### Still open, deliberately not changed
The note BODY path starts top-left and runs right along the top; upstream runs
DOWN the left side first (`Opale.java:152-157`). A `d`-string difference, not a
child-count one, and it would move bytes in three engines at once.
