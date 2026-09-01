# Mission: sequence-coordinate-convergence

**Branch**: `feat/sequence-coordinate-convergence`, cut from `main`
(`ebbd1f41` or later). Merge commit back to `main`; never squash.

## Objective

Make this port's sequence-diagram X COORDINATES converge on the jar's, so that
geometry work in this engine becomes measurable at all.

Today it is not. Three consecutive correct, jar-verified geometry fixes —
nested activation indent (`bbcc90ae`), message endpoint offsets (`5dfa0982`),
self-loop offsets (`ebbd1f41`) — each adjudicated `regression=0 artefact=0
improved=0 unchanged=1124`. The corpus scored all three at exactly zero.

The reason is not the comparator's short-circuit, which is the obvious
suspect and the wrong one: **714 of 1124 fixtures descend fine**, 77 of them
carry activations, and 67 of those have an arrow endpoint those commits
moved. The comparator reached the changed coordinates and the score still did
not move.

The reason is that `weightedScore` counts wrong THINGS, and nearly every
coordinate is wrong because the coordinate system underneath is wrong. See
`decisions.md` D1 for the numbers and D2 for the single constant that causes
most of it.

## The measured starting condition

- `theme.ts:322`, `sequence.participantMinWidth: 80` — uncited, no upstream
  counterpart, and upstream's own floor is 0 (D2).
- **1033 of 1124 fixtures (92%)** have at least one participant box pinned at
  that floor; **2358 of 2850 participants (83%)**.
- `jobadi-87-jegi648`: our `Bob` box is `width="80" height="34"`, the jar's is
  `width="38.938" height="28"`.
- Text measurement already agrees with the jar to within 0.001px (D3), so
  this is arithmetic.
- 410 of 1124 fixtures additionally short-circuit at the top-level child
  count; 169 of those are within 2 elements of clearing it. That is a
  SEPARATE backlog and a non-goal here.

## Batches

Nine batches, twenty-one tasks. Order is dependency, not preference (D4).

### Batch 1 — the instrument, before any change

Nothing else can be judged without it (D1).

| # | task | write-set |
|---|---|---|
| T1.1 | `scripts/sequence-geometry-distance.ts`: sum of `\|delta\|` over numeric diffs, per fixture and corpus-wide, with a per-attribute breakdown (`@x`, `@x1`, `@width`, …). Drive it through `renderFixtureSequence` + `DeterministicMeasurer` + `fixtureIncludeStore()` explicitly — never `renderSync` (it returns `errorSvg` without a store). | `scripts/sequence-geometry-distance.ts`, its unit test |
| T1.2 | Record the baseline at the parent commit, per-attribute, into `plans/sequence-coordinate-convergence/findings/baseline.md`. This is the number every later batch reports against. | `findings/baseline.md` |

**Gate:** the instrument is deterministic — two runs byte-identical.

### Batch 2 — the plain participant box: WIDTH

| # | task | write-set |
|---|---|---|
| T2.1 | Derive upstream's width exactly, from `ComponentRoseParticipant#getPreferredWidth` (`:135-137`), `getPureTextWidth` (`:140-142`), `AbstractTextualComponent#getTextWidth`, and `plantuml.skin`'s `participant,actor,… { Padding 7 }` (`:186-190`). Settle where the 14 lives — inside `getTextWidth` as PADDING, or added after as MARGIN — against at least six goldens spanning short and long labels. Write it up before editing. | `findings/participant-width.md` |
| T2.2 | Apply it: remove `sequence.participantMinWidth`, correct `participantPadding` to whatever T2.1 proved. Pin box width against ≥6 named goldens in a test. | `src/core/theme.ts`, `src/diagrams/sequence/sequence-layout-participants.ts`, `tests/unit/sequence/participant-sizing.test.ts` |

**Gate:** box width exact on the six pinned goldens; distance instrument's
`@width` and `@x` totals both FALL.

### Batch 3 — the plain participant box: HEIGHT

Separate from Batch 2 because `getPreferredHeight` has its own `+ 1` and its
own definition of `getTextHeight`, and guessing either is how a fitted
constant gets in.

| # | task | write-set |
|---|---|---|
| T3.1 | Derive it: `getPreferredHeight = getTextHeight + margin.top + margin.bottom + deltaShadow + 1 + getDeltaCollection()` (`:129-132`). Our box is 34, the jar's 28, our `measure('M').height` is 14 — reconcile all three before editing. | `findings/participant-height.md` |
| T3.2 | Apply and pin. Note it moves `headHeight`, hence every body y and the footbox row. | `src/diagrams/sequence/sequence-layout-participants.ts`, tests |

**Gate:** box height exact on the pinned goldens; `@height` and `@y` totals fall.

### Batch 4 — the seven non-rectangular heads

`actor`, `boundary`, `control`, `entity`, `database`, `queue`, `collections`
each have their own `ComponentRose*#getPreferredWidth/Height`. They currently
route through `symbolPreferredWidth`/`symbolPreferredHeight`, which Batches
2–3 do not touch — so they will be LEFT BEHIND unless done deliberately.

| # | task | write-set |
|---|---|---|
| T4.1 | Audit all seven against their Java, one row per kind: our formula, upstream's, a golden that exercises it. `planning/usymbol-composition.md` already covers the shared USymbol layer — read it first rather than re-deriving. | `findings/participant-symbols.md` |
| T4.2 | Fix the kinds the audit finds wrong. | `sequence-layout-participant-sizing.ts`, tests |
| T4.3 | `collections`' `getDeltaCollection()` and the `COLLECTIONS_DELTA` constant — verify or replace. | same |

**Gate:** every kind exact on its named golden, or its residual documented
with a mechanism.

### Batch 5 — the left origin and the document margins

| # | task | write-set |
|---|---|---|
| T5.1 | Derive the jar's own left origin: `xorigin.addAtLeast(0)` plus `getTextBlock`'s `ug.apply(new UTranslate(5, 5))` (`SequenceDiagramFileMakerTeoz.java:89-110,132`), against `jobadi`'s first box at `x=10`. Reconcile with this port's `LEFT_MARGIN` (30) and `RIGHT_MARGIN` (30). | `findings/document-margins.md` |
| T5.2 | Apply and pin. | `sequence-layout-participants.ts`, `layout.ts`, tests |

**Gate:** the first participant box's `x` is exact on ≥3 goldens.

### Batch 6 — inter-participant spacing

| # | task | write-set |
|---|---|---|
| T6.1 | `LivingSpaces#addConstraints` is `nextA >= prevE + 10` (`:61-71`), chained off `getPosD` (`SequenceDiagramFileMakerTeoz.java:96`); `posB`/`posC`/`posD` are box-left / centre / box-right (`LivingSpace.java:223-248`). This port advances by `width/2 + participantGap(20) + nextWidth/2`. Reconcile, including what `posA`/`posE` add over `posB`/`posD` (englobers). | `findings/participant-spacing.md` |
| T6.2 | Apply and pin lifeline `centerX` against ≥4 goldens. | `sequence-layout-participants.ts`, `theme.ts`, tests |

**Gate:** lifeline `x1` exact on the pinned goldens with no labels in play.

### Batch 7 — label-driven gap widening (the D6 decision)

| # | task | write-set |
|---|---|---|
| T7.1 | Decide D6 — keep the pairwise pre-scan or port the `Real` constraint system — and record which, with the cases the chosen one is known to get wrong. This is an architecture decision and belongs in `decisions.md`, not in a code comment. | `decisions.md`, `findings/label-widening.md` |
| T7.2 | Implement the decision; if the pre-scan is kept, file the divergence. | `sequence-layout-participants.ts`, `DIVERGENCES.md`, tests |

**Gate:** lifeline `centerX` exact on ≥4 goldens that DO have wide labels.

### Batch 8 — re-verify the three activation-geometry commits, absolutely

They were verified RELATIVELY (offset from our own lifeline) because absolute
comparison was impossible. It is now possible, and if any of them is wrong
this is where it surfaces.

| # | task | write-set |
|---|---|---|
| T8.1 | Activation bars: position, width, per-level indent — absolute, against `kejoke-76-curu931` (four levels) and `rugeco-70-muro754`. | `findings/activation-verify.md` |
| T8.2 | Message endpoints, both branches, against `rugeco` (forward) and `kejoke` (reverse). | same |
| T8.3 | Self loops, against `jobadi-87-jegi648` and `gesiba-07-rise357`, including `SELF_LOOP_WIDTH`'s known 40-vs-45 gap (Gap SQ-5) which becomes measurable here. | same |

**Gate:** each is exact, or its residual has a stated mechanism and a
`DIVERGENCES.md` entry. A residual with no mechanism is stop condition 3.

### Batch 9 — adjudicate and close out

| # | task | write-set |
|---|---|---|
| T9.1 | `sequence-ratchet-adjudicate.ts --base <parent>` over all 1141. Every rise carries a verdict; zero `regression` that survives diagnosis. | `findings/adjudication.md` |
| T9.2 | Re-pin ONCE (D5). Measure `diffCount` fresh first — the snapshot carries none and the script falls back to the stale pinned value. Then diff the JSON and check every RAISED pin against an adjudicated `artefact`. | `oracle/goldens/svg-sequence/diff-baseline.json` |
| T9.3 | Regenerate `diff-census.json`; report the distance instrument's before/after; write the Outcome section. | `oracle/goldens/svg-sequence/diff-census.json`, `README.md` |

## Quality gates

Per task: `npm run typecheck`, `npm run lint`, `npx vitest run tests/unit`,
`npm run build`, all exit 0; `git diff --name-only` matches the declared
write-set.

Per batch: the distance instrument, reported per-attribute against Batch 1's
baseline. **The gated quantity for this mission is total distance, not
`weightedScore`** (D1). Run the ratchet too, as a regression backstop — but a
rise is expected and is adjudicated at Batch 9, not per batch (D5).

## Stop conditions

1. A file outside the write-set needs changing and no task owns it.
2. Two consecutive quality-gate failures on the same check.
3. A residual coordinate error with no stated mechanism. "Close enough" is
   not a mechanism, and neither is "the golden must be doing something else".
4. Total distance RISES across a batch, and diagnosis does not explain it.
5. A constant with no upstream `file:line` — the mission exists to remove one
   of those, so introducing another is a hard stop.
6. Batch 7's D6 decision being made implicitly by an edit rather than
   explicitly in `decisions.md`.

## Non-goals

- The 410 fixtures that short-circuit at the top-level child count. 169 are
  within 2 elements and that is a real backlog, but it is element COUNT, not
  coordinates, and mixing the two makes both unmeasurable.
- Y-coordinate convergence beyond what Batch 3 moves as a side effect.
- The `Real` constraint system as a wholesale port, unless Batch 7 decides
  otherwise and the maintainer agrees to the scope change.
- Reverse self messages (`A <- A`) — `arrowConfigurationOf` drops
  `reverseDefine`, which is a parser-model gap, not a coordinate one.

## Note for whoever plans the next one

`planning/mission-guide.md`'s G-1 entry is stale: it says sequence "has no
jar-oracle coverage… no `test-results/dot-cache/sequence/` and no
`oracle/goldens/svg-sequence/`". Both have existed since
`sequence-oracle-harness` (2026-08-20). Correcting it is not in this
mission's write-set; it is worth a one-line chore.

---

# Outcome

**Executed and closed 2026-09-01** on `feat/sequence-coordinate-convergence`,
cut from `main` @ `ebbd1f41`. Nine batches, all gates met. The objective —
make this port's sequence X coordinates converge on the jar's, so geometry
work becomes measurable at all — is met.

## The headline

| | baseline (`ebbd1f41`) | close | change |
|---|---:|---:|---:|
| total geometry distance | 4 175 357.109 | **2 578 916.759** | **−1 596 440.350 (−38.2%)** |
| numeric diffs | 72 266 | **51 890** | −20 376 |
| fixtures with EVERY lifeline centre exact | — | **482** of 1039 | — |
| fixtures with the first lifeline centre exact | — | 747 | — |
| leftmost participant box exact | ≈0 | **707** of 1044 | — |
| census `geometry` diffs | 78 786 | **58 410** | −25.9% |
| census total | 111 021 | **89 338** | −19.5% |

Not one fixture changed descent status across the whole mission, so none of
that fall is short-circuit artefact.

Adjudication against the parent commit:
`improved=712  unchanged=407  inconclusive=17  regression=5`, and **no
regression survives diagnosis** (`findings/adjudication.md`).

## Per batch

| batch | what it was | distance after | gate |
|---|---|---:|---|
| 1 | the instrument | 4 175 357.109 | two runs byte-identical ✓ |
| 2 | participant box WIDTH: `text + 14`, no floor | 3 114 547.085 | `@width` and `@x` both fell ✓ |
| 3 | participant box HEIGHT: `text + 14`, plus the reserved `+ 1` | 3 076 534.997 | `@height` and `@y` both fell ✓ |
| 4 | the seven glyph heads — audited, all already exact | 3 076 534.997 | every kind exact on its golden ✓ |
| 5 | the document origin: 10 a side, and SOLVED | 2 661 116.421 | first box exact on 707 ✓ |
| 6 | inter-participant spacing: 10, not 20 | 2 603 787.547 | lifeline `x1` exact on the pins ✓ |
| 7 | D6 decided; the constraint set, solved exactly | 2 578 916.759 | centres exact on 4 wide-label goldens ✓ |
| 8 | the three activation commits, re-verified absolutely | 2 578 916.759 | all three exact ✓ |
| 9 | adjudicate, re-pin once, close out | — | zero surviving regressions ✓ |

## What was actually wrong

Eight constants and one structure, every replacement carrying an upstream
`file:line`:

| | was | is | source |
|---|---|---|---|
| participant min width | 80 | **removed** | `Rose#getMinClassWidth` → `ValueNull#asDouble()` = 0 |
| participant padding | 10 | **7** | `plantuml.skin:186-190` |
| head reserved height | = box | **box + 1** | `ComponentRoseParticipant#getPreferredHeight:129-132` |
| box height term | `+ 20` | **`+ 2 × 7`** | `AbstractTextualComponent#getTextHeight:110-114` |
| left/right margin | 30 | **10** | `getDefaultMargins:624-628` + `getTextBlock`'s `UTranslate(5,5)` |
| `BORDER1` | 0 | **`LEFT_MARGIN`** | `PlayingSpace.java:318-320` |
| group frame margin | 20 | **16** | `GroupingTile.MARGINX:89` |
| group footprint | — | **+ 3 left** | `GroupingTile.EXTERNAL_MARGINX1:82` |
| participant gap | 20 | **10** | `LivingSpaces#addConstraints:61-71` |
| message label font | 14 | **13** | `plantuml.skin:306-308` |
| `SELF_LOOP_WIDTH` | 40 | **42** | `ComponentRoseSelfArrow.java:59-60` |
| origin | fixed | **solved** | `dx(-min1)`, `SequenceDiagramFileMakerTeoz:82,135-136` |
| label widening | adjacent-only pre-scan | **exact constraint solve** | D6 |

## The three commits Batch 8 re-verified

All three hold, now absolutely rather than relatively:

- `bbcc90ae` — 14 of 14 activation bars on `kejoke-76-curu931` exact;
- `5dfa0982` — 24 of 24 message endpoints on the same fixture exact;
- `ebbd1f41` — the whole self-loop x geometry on `jobadi-87-jegi648` exact.

Gap SQ-5 is closed, and its recorded numbers corrected: the gap was 40 vs
**42**, not 40 vs 45.

## Residuals, each with a mechanism

None is an effort excuse; each names the term and where it comes from.

1. **The unmodelled `LIVE_DELTA_SIZE` family** — `addConstraints`' endpoint
   adjustments (`:405-413`), `isCreate()`'s `posB`/`posD` (`:423-431`), and
   the self loop's `deltaX1` (`drawRightSide:93`). Signature: spans involving
   a live participant are 5px short each.
   `TeozTimelineIssues_0003_Test`'s second lifeline is 79.669 against 84.669.
   Blocked on ordering — the span scan runs before the walk that computes
   levels, where upstream's `Real` defers the arithmetic.
2. **The vertical document margin** — 10 top and bottom, derived in Batch 5
   and applied only on x. It is why the five adjudicated rises exist. Y-axis
   work, an explicit non-goal here.
3. **`SELF_LOOP_HEIGHT` 20 vs upstream's 13** (`getArrowOnlyHeight:321-323`).
   Same reason; now cited in the code.
4. **Self loops are one `<path>` where the jar emits three `<line>`s.** A
   structural divergence, and it makes every self-message geometry invisible
   to the comparator — which is why Batch 8's fix moved the metric by zero.
5. **33 fixtures still render content at a negative x**, because message
   label extents are deliberately out of the origin walker. Measured both
   ways; including them fixes 26 but costs 20 fixtures their origin and 6236
   of distance, and the choice is D6's domain.
6. **Per-element font resolution.** `arrow` is now 13; `groupHeader` (11) and
   `box` (13) remain on the ambient size.
7. **Englober and self-overflow margins** in `posA`/`posE`
   (`Doll.java:220-221`, `CommunicationTileSelf.java:208-213`), unmodelled.
8. **`ActorBorderColor` is dropped** on the actor stickman's stroke — a
   colour, found in Batch 4, invisible to this mission's gate.

## Non-goals, honoured

The 410 fixtures short-circuiting at the top-level child count were not
touched, y-convergence beyond Batch 3's side effects was not pursued, `Real`
was not ported, and reverse self messages were left alone.

## For whoever plans the next one

`planning/mission-guide.md`'s G-1 entry is still stale — it says sequence has
no jar-oracle coverage, and both `test-results/dot-cache/sequence/` and
`oracle/goldens/svg-sequence/` have existed since 2026-08-20. Still worth a
one-line chore; still outside this mission's write-set.

The obvious next mission is **the Y axis**: the vertical document margin,
`SELF_LOOP_HEIGHT`, and whatever else the `@y` / `@y1` / `@y2` totals
(455 072 + 117 022 + 195 029 = 767 123, now 30% of all remaining distance)
turn out to be. The instrument and the cohort discipline are in place for it.
