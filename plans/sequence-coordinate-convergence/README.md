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
