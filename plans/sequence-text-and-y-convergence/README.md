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
| [5](batch-5/overview.md) | C1 C2 C3 C4 | the Y axis, and close-out | [x] |

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

## Outcome — closed 2026-09-02 at `3eb50eb8` (C4)

All five batches ran; B4..Bn stayed halted under stop condition 9. The one
re-pin of the mission (D5) happened here, after adjudication, and the ratchet
is **GREEN for the first time since batch 2**.

Full working in [`findings/adjudication.md`](findings/adjudication.md);
[`findings/vertical-terms.md`](findings/vertical-terms.md) holds C2's
derivation and the orchestrator ruling that moved the `ensureVisible +1` off
the shared shell and onto the sequence path.

### Total distance, per batch

Whole corpus, `scripts/sequence-geometry-distance.ts`. The last two rows were
re-measured by C4; the first two are as recorded at the time.

| point | distance | numeric diffs |
|---|---:|---:|
| mission plan's starting condition (`7fd45458`) | 2 578 917 | 51 890 |
| batch 3 close — Phase A, A6 (`d26ad9c7`) | 2 437 185 | 48 904 |
| batch 5 start (`1f15652f`) | 6 267 364.645 | 69 994 |
| **batch 5 close (`3eb50eb8`)** | **3 881 044.667** | **36 195** |

The rise from 2 437 185 to 6 267 364.645 is not a regression this mission
caused and not a batch-4 defect. Batch 4's B1–B3 and the unrelated
`plans/sequence-creole/` mission both **grew our output**, so the comparator
descends further into documents it previously short-circuited out of and
charges error it could not previously see. §3 of the adjudication measures
that window directly: 73 pins rose inside it, every one reproducing its
pinned score exactly when re-rendered at its own pin commit.

### Per-axis, before and after C3

The split only exists from C1 onward (`points` folds both axes together, so
no flat per-attribute table can settle which axis dominates).

| axis | `1f15652f` | `3eb50eb8` | Δ |
|---|---:|---:|---:|
| x | 2 806 339.688 | 2 805 967.768 | −371.920 (−0.0%) |
| **y** | **2 833 294.965** | **644 342.844** | **−2 188 952.121 (−77.3%)** |
| mixed (`d`, `viewBox`) | 627 729.993 | 430 734.055 | −196 995.938 (−31.4%) |
| **total** | **6 267 364.645** | **3 881 044.667** | **−2 386 319.978 (−38.1%)** |

**Concentration is above the 20% alarm and these totals are therefore not
corpus statements.** `vofupo-09-gafe466` alone is 1 732 795.123 → 1 732
393.123 — it barely moved while everything else halved, so its share rose
from 27.6% to **44.6%**; the heaviest ten are 62.9%. `zudize-61-vomi445` —
the 45 512-line stress case this mission's non-goals exclude — is 11 972 →
7 346, **0.2%** of the total at both ends, so it distorts nothing here.

Excluding both named fixtures, the same table:

| axis | `1f15652f` | `3eb50eb8` | Δ |
|---|---:|---:|---:|
| x | 1 141 882.565 | 1 141 510.645 | −0.0% |
| **y** | **2 822 518.965** | **636 236.844** | **−77.5%** |
| mixed | 558 195.993 | 363 558.055 | −34.9% |
| **total** | **4 522 597.522** | **2 141 305.544** | **−52.7%** |

The Y result is the same with or without them. The x column moving by 372 is
the point of C3 being one commit: it changed no horizontal term, and the
instrument shows it.

### Canvas dimensions — the defect batch 5 existed to close

Root `width`/`height` against the jar's, over the 1124 measurable fixtures.

| | `1f15652f` | `3eb50eb8` |
|---|---:|---:|
| height EXACT | 10 (0.9%) | **642 (57.1%)** |
| width EXACT | 0 (0.0%) | **424 (37.7%)** |
| both EXACT | 0 (0.0%) | **377 (33.5%)** |
| height within 1% | 23 (2.0%) | 665 (59.2%) |
| width within 1% | 417 (37.1%) | 446 (39.7%) |
| median absolute height error | 14.97% | **0.00%** |
| median absolute width error | 5.52% | 5.24% |
| mean signed height error | +39.61 | −8.41 |
| too tall / too short | 951 / 163 | 200 / 282 |

The checkpoint above recorded document height as wrong on 98% of the corpus.
It is now exact on 57%, and the median fixture's height error is zero. Width
EXACT going 0 → 424 is the `ensureVisible` semantics landing on the sequence
extent rather than on `document-shell.ts`, per the orchestrator ruling.

### The cohort at close

```
fixtures=1141 measured=1124 errored=17 descended=888 shortCircuited=236  distance=3881044.667 numericDiffs=36195
```

### Adjudication and the re-pin

```
artefact=0  substructure=0  regression=3  inconclusive=22  improved=930  unchanged=186
REPINNED 1115 entries at 3eb50eb8      lowered=1041  unchanged=26  RAISED=74
```

**Zero regressions survive diagnosis**, and **every one of the 74 raised pins
is accounted for**: one (`fululo-61-zuro165`) rose inside batch 5 and is
residual 1 below; the other 73 were already above their pin at `1f15652f`,
measured by re-rendering each at its own pin commit — all 73 reproduce their
pin to the unit and all 73 had already risen before this batch began.
`diffCount` was measured fresh first: **976 of 1141 pinned counts had
drifted**, the largest `rujapu-71-bidi404` 5 → 764.

### Residuals — five, each with its mechanism

**1. `descended` fell 891 → 888.** Three fixtures — `covuco-47-sotu151`,
`fululo-61-zuro165`, `lifene-24-xaca574` — the corpus's only `newpage`
fixtures with an activate/deactivate pair on page 2. C3 removed a clamped
1×10 `<rect>` the jar never draws; that rect had been accidentally filling a
slot, so page-1's child count went 5 → 4 against the jar's 5 and
`compare.ts:396-406` short-circuits. The port's content is strictly more
correct; what is exposed is a pre-existing element gap — the jar emits
exactly one empty `<g><title></title></g>` in each of the three (verified by
direct count on the goldens) and this port emits none. Its upstream mechanism
is **not** nailed down: `LiveBoxes#drawBoxes:374-388` opens no group. Filed as
an element-backlog item against `renderer-lifeline.ts`, mechanism open, not
guessed at. Stop condition 7 sets the floor at 714 and is not tripped; the
fall is recorded and adopted rather than reverted, because reverting it means
re-drawing a rect the jar does not draw.

**2. The five sprite canaries rose as C2 predicted.** `mifafi-02-dofi536`,
`musive-74-reva838`, `posura-78-koji601`, `vekuno-87-ponu028` all went 137 →
124 against a jar of 147, and `rapoto-38-neca900` 634 → 544 against 644.
Signed height error moved −10 → −23 for the four and −10 → −100 for `rapoto`,
which carries the same mechanism at scale. The 13 is the body excess C3
correctly removed; the survivor is C2 §1.10's unmodelled sprite-label height,
now in isolation. **Deliberately not chased** — it is the sprite-height task's
own canary set, and every one of the five is a sprite-in-label fixture, so
none of them is evidence about margins.

**3. `metano-36-gevu843` deviated from C2's prediction**: 190 → 157, not 130.
The residual is exactly 27, one flat-message tile. `note left: ok` after a
message is a note-ON-message: `TileBuilder:102-109` wraps the message tile in
`CommunicationTileNoteLeft`, whose height is
`max(tile, note)` (`CommunicationTileNoteLeft#getPreferredHeight:133-137`),
and this port has no note-on-message concept. A feature, not a constant.

**4. The `else` rule is one pixel high.** Upstream draws it at `tileTop + 1`
(`ComponentRoseGroupingElse#drawInternalU:104-107`,
`ug.apply(UTranslate.dy(1)).draw(ULine.hline(...))`); this port draws it at
`tileTop`. One pixel per `else` separator. Cited, real, and outside the set
C2 proved, so C3 did not take it.

**5. Four theme fields are kept and documented inert, not deleted.**
`messageSpacing`, `lifelineExtension`, `noteMargin` and `frameHeaderHeight`
are required members of the exported `Theme` type, which `resolveTheme`
accepts a partial override of. Each carries an `INERT — no reader` doc
comment naming the upstream term that replaced it
(`src/core/theme.ts:279-300`). A knob documented as doing nothing beats one
that silently does nothing.

Two further mechanisms were found during adjudication and are written up in
[`findings/adjudication.md`](findings/adjudication.md) §1.1–§1.2 rather than
here: **message wrapping** (`skinparam maxMessageSize` / `wrapMessageWidth`,
`SkinParam#maxMessageSize:971-978`) is unported, and the **englober band** a
`box` adds (`heightEnglober1` = 5, `heightEnglober2` = 10,
`SequenceDiagramFileMakerTeoz:84-85`) is unmodelled. Both are compensating
errors C3 exposed rather than caused, and both are the whole of the eight
adjudicated rises.

### Quality gates

| gate | result |
|---|---|
| `npm test` | **PASS** — 681 files, 17 631 tests; coverage 95.56 / 90.80 / 96.92 / 96.60 |
| ratchet, run alone | **GREEN** — 1151 tests, first time since batch 2 |
| `npm run typecheck` | PASS (both tsconfigs) |
| `npm run lint` | PASS |
| `npm run build` | PASS |

### Rollback — reversible, with one constraint

The C3 source change and these baselines must revert **together**. Reverting
either alone leaves `oracle/goldens/svg-sequence/diff-baseline.json` pinned to
scores no commit in the tree produces, and the ratchet then fails on ~1041
rows for a reason unrelated to whatever prompted the revert. Revert
`3eb50eb8` and this commit as a pair, or neither.

### Follow-ons this mission deliberately did not take

- The **sprite/emoji label height** (C2 §1.10, §3) — owns the five canaries.
- **Message wrapping** — `maxMessageSize` / `wrapMessageWidth`.
- **The englober band** — `heightEnglober1` / `heightEnglober2` for `box`.
- **Note-on-message** tiles — residual 3.
- The **page-2 empty group** — residual 1, mechanism open.
- **`ref` body geometry** (C2 §1.9) and the **bare `destroy` 18** (C2 §5.4).
- The **`else` rule's +1** — residual 4.

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
