# Mission: sequence-text-and-y-convergence

**Branch**: `feat/sequence-text-and-y-convergence`, cut from `main`
(`7936be43` or later). Merge commit back to `main`; never squash.

## Objective

Make the sequence engine emit text the way the jar does, close the element
gaps that keep a third of the corpus unmeasurable, and then converge the Y
axis — in that order, because the last two cannot be honestly measured until
the first lands.

## Why this order, and not by size

The Y axis is **63.9% of the real remaining error** and it is deliberately
third. Two measurements decide the ordering, both taken 2026-09-01 on
`7fd45458`:

1. **423 064 of the remaining distance is not error.** This port anchors
   85.3% of its text (38 138 elements); the jar anchors none of its 70 622 and
   gives 97.3% a `textLength`. The comparator compares our centre against the
   jar's left edge and charges the difference. On `jobadi-87-jegi648` our
   label centre is 29.469, the jar's is `17 + 24.938/2 = 29.469` — identical
   to the thousandth — and the comparator charges 12.469. `text@y` alone is
   261 525, a quarter of all Y positional error, and it is a category error
   until Phase A lands.
2. **The one derived Y lever backfires alone.** Probing the vertical document
   margin raised total distance by 35 145 while lowering diff count by 6 447 —
   top edges moved onto the jar's, every bottom edge and extent moved off.

Batch 8 of the previous mission did correct, jar-verified work that moved the
metric by exactly zero because the comparator could not descend to it.
Starting with more arithmetic repeats that.

## Where Phase A left it (A6, `d26ad9c7`)

```
total distance 2 437 185   numeric diffs 48 904      (was 2 578 917 / 51 890)
cohort         1141 fixtures · 1124 measured · 714 descended · 410 short-circuited · 17 errored
concentration  heaviest fixture 9.2%, heaviest ten 27.8%  (not outlier-dominated)
adjudication   improved=1017  substructure=79  regression=0  inconclusive=17  unchanged=28
```

Phase A removed **141 731.9**, 5.5%. Zero `<text>` elements carry an anchor.
**The 423 064 was not all phantom** — the x half was and is largely gone, the y
half never was. [`findings/text-convention.md`](findings/text-convention.md)
has the correction and the numbers C2 reads; §3 is the one Phase C must not
skip.

## Starting condition (measured, not carried forward)

```
total distance 2 578 917   numeric diffs 51 890
cohort         1141 fixtures · 1124 measured · 714 descended · 410 short-circuited · 17 errored
concentration  heaviest fixture 8.7%, heaviest ten 28.2%  (not outlier-dominated)
```

The baseline snapshot is
`plans/sequence-coordinate-convergence/findings/baseline.json`; every gate
below reports against it via `--compare`.

## Phases and batches

| batch | tasks | what | status |
|---|---|---|---|
| [1](batch-1/overview.md) | A1 | the text emitter, the run metrics, the `ast.ts` split | [x] |
| [2](batch-2/overview.md) | A2 A3 A4 A5 | the four text kinds, in parallel | [x] |
| [3](batch-3/overview.md) | A6 | Phase A sweep, adjudicate, measure | [x] |
| [4](batch-4/overview.md) | B1 B2 B3 (+B4..Bn) | the element deficit | B1 B2 B3 [x] · **B4..Bn halted — stop condition 9** |
| [5](batch-5/overview.md) | C1 C2 C3 C4 | the Y axis, and close-out | [ ] |

**Hard checkpoint before batch 5.** Phase C's derivation reads numbers that
only exist once Phase A has closed. Stop after batch 4, report, and wait.

> **CHECKPOINT SATISFIED, and the batch-5 starting condition is REFRESHED —
> 2026-09-02.** Batch 4 reported (B1-B3 done, B4..Bn halted under stop
> condition 9), and an unrelated mission — `plans/sequence-creole/`, executed
> and closed on the branch above this one — landed in between. Every number
> this brief was planned against has therefore moved, and batch 5 must be run
> against the figures below, not the ones in "Starting condition" above.
>
> ```
> fixtures=1141 measured=1124 errored=17 descended=891 shortCircuited=233
> distance=6267364.645 numericDiffs=69994
> concentration heaviest vofupo-09-gafe466 = 27.6%, heaviest ten 56.6%
> ```
>
> **Concentration is above the 20% alarm**, so corpus totals are not quotable
> here — report per-axis subtotals and named fixtures, per D7.
>
> **The "63.9%" premise at the top of this file is STALE and must not be
> quoted.** Re-measured flat per-attribute totals: Y-family (`y`, `y1`, `y2`,
> `height`, `cy`) **2 031 467**; X-family (`x`, `x1`, `x2`, `width`, `cx`)
> **1 931 743**; axis-mixed (`points`, `d`) **2 093 695**. Flat, the two axes
> are now roughly EVEN. That is precisely why C1 exists: `points` alone is
> 1 676 411 and folds both axes together, so no flat table can settle which
> axis dominates. **C1 re-derives the split; C2 reads C1's output, not this
> note.**
>
> The Y case does not rest on the flat table anyway. Measured over all 1124
> comparable fixtures, canvas dimension against the jar's:
>
> | | within 1% of the jar |
> |---|---|
> | width | 416 (37.0%) |
> | height | **23 (2.0%)** |
> | both | **3 (0.3%)** |
> | median absolute error | width 5.5%, height **15.0%** |
>
> Document HEIGHT is wrong on 98% of the corpus against 63% for width. That is
> the defect this batch exists to close.

## Quality gates

All four, per `CLAUDE.md`, at every task close — **`npm test`, not
`npx vitest run tests/unit`**. The narrower gate hid two real failures until
close-out last mission (catalog drift, a rounding-sensitive integration
assertion).

```
npm test          # vitest + 90/90/90 coverage
npm run typecheck # both tsconfigs
npm run lint
npm run build
```

Per batch, additionally:

```
npx jiti scripts/sequence-geometry-distance.ts \
  --compare plans/sequence-coordinate-convergence/findings/baseline.json
```

The gated quantity is **total distance and its per-attribute breakdown**, never
`weightedScore` (D1 of the previous mission). `git diff --name-only` must match
the declared write-set.

## The ratchet is red for this entire mission

`tests/oracle/svg-conformance/sequence.diff-baseline.ratchet.test.ts` will fail
from batch 2 until C4 re-pins. **This is expected and is never a stop
condition.** Re-pinning happens once, at C4, after adjudication — D5 of the
previous mission, which held: 712 improved, 5 rose, every rise accounted for.

Run the ratchet as an instrument if you like; do not act on it.

## Stop conditions

1. A file outside the write-set needs changing and no task owns it.
2. Two consecutive gate failures on the same check. The cap bounds EDITS, not
   investigation — keep diagnosing until you can state the mechanism, then
   stop with the artefact `~/.claude/rules/diagnosis.md` defines.
3. An edit contradicts [`decisions.md`](decisions.md) D1–D8 — in particular
   recomputing a text metric inside a renderer (D1), reintroducing
   `textAscent` arithmetic on the sequence path (D2), or putting a scalar text
   metric back on a geometry type (D8).
4. A constant arrives without an upstream `file:line`.
5. A residual coordinate error with no stated mechanism. "Close enough" is not
   a mechanism.
6. **A1 moves any golden.** Its gate is that nothing moves.
7. **A fixture leaves the descended cohort** (the `descended=` count falls
   below 714). Every prior phase held this at zero; Phase A is the first that
   can break it.
8. `textLength` disagrees with `measure()` at the same spec — the visible
   text-distortion failure mode, which the comparator barely sees.
9. B1 finds more than three distinct features behind the element deficit.
10. Phase C begins before A6 has recorded its measurement (D6).
11. Total distance rises across a phase and diagnosis does not explain it.

## Push forward

- **A red ratchet.** First on this list because it is the most likely false
  stop.
- A test constant that moves for a stated, measured reason — update it with
  the mechanism in the comment, log the row.
- A residual matching a mechanism already on record: the `LIVE_DELTA_SIZE`
  family, the `<path>`-versus-three-lines blindness, the vertical margin.
- A task smaller than estimated — do it, log why.
- Naming, phrasing or file placement where the codebase has no precedent.

## Non-goals

- **Newpage titles.** `NewpageGeo` carries no text and neither does upstream:
  `ComponentRoseNewpage#drawInternalU` draws one `hline` and nothing else. An
  earlier version of A5 listed one; it was the divider label, misread.
- **Message-level `[[url]]`.** `A -> B [[url]] : label` emits no `<a>` in the
  jar — verified on `fajixi-56-dete708` and recorded at
  `renderer-message.ts:118-138`. Do not "fix" it.
- **Creole `[[url]]` inside a label.** A creole feature (`devamo-31-coji129`),
  not a sequence one.
- The `Real` constraint system. D6 of the previous mission settled it.
- Consolidating `textAscent` across state/class (D2) — a separate chore.
- `zudize-61-vomi445` as a fixture. It is a 45 512-line stress case that
  distorted the analysis this mission is built on; report per-fixture or
  exclude it, and say which.

## Index

- [`decisions.md`](decisions.md) — D1–D7 confirmed before execution; **D8
  added mid-mission**, moving the metrics onto `TextRun` and splitting
  `ast.ts`. Batch 2's contract was rewritten against it.
- [`decision-journal.md`](decision-journal.md) — appended during execution
- [`diagrams/component-map.md`](diagrams/component-map.md) — what this touches
- [`diagrams/data-flow.md`](diagrams/data-flow.md) — how a text metric travels
- `findings/` — written by A6, B1, C2 and C4
- Prior mission: [`../sequence-coordinate-convergence/README.md`](../sequence-coordinate-convergence/README.md)
- Analysis this brief implements: [`../../planning/sequence-next-missions.md`](../../planning/sequence-next-missions.md)
