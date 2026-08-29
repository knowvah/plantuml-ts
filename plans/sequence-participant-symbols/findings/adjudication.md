# Adjudication — `sequence-participant-symbols` (T7)

Measured 2026-08-29 on branch `feat/sequence-participant-symbols` at
`bce135dc`, working tree clean. Every number below is a measurement taken in
this run, not carried forward.

Instrument: `npx jiti scripts/sequence-ratchet-adjudicate.ts --base <ref>`,
which renders through `tests/oracle/svg-conformance/render-fixture-sequence.ts
#renderFixtureSequence` with `DeterministicMeasurer` and
`fixtureIncludeStore()` passed explicitly — never `renderSync`. `--base` and
`--snapshot` are mutually exclusive; only `--base` was passed.

## 1. The verdict split, both refs

| ref | fixtures | skipped | regression | artefact | substructure | improved | inconclusive | unchanged |
|---|---|---|---|---|---|---|---|---|
| Batch-4 parent `74bc5c93` | 1141 | 0 | **0** | 0 | 0 | 68 | 22 | 1051 |
| `main` (whole mission) | 1141 | **0** | **0** | 10 | 0 | **80** | 19 | 1032 |

The adjudicator reports its own skip count as 0 at both refs: every one of the
1141 fixtures in `test-results/dot-cache/sequence/` was measured. (17 of them
return a NULL score at BOTH refs — they fail to render at all, unchanged by
this mission — which is a measured null, not a skip.)

Σ `weightedScore` is not a figure this instrument prints, and summing it across
1141 fixtures would be a worse number than the per-fixture split above: it is
dominated by a handful of 2000–7500 fixtures whose size swamps every row this
mission moved. The per-fixture verdicts are the census; §3 is the residue.

## 2. The three baseline-red fixtures

| fixture | baseline | at `main` | now | state |
|---|---|---|---|---|
| `junaxa-14-biko373` | 673 | 725 | **333** | **CLOSED** — the mission's target |
| `fobube-11-nifo424` | 375 | 402 | 402 | unchanged (`unchanged` verdict at both refs) |
| `rugeco-70-muro754` | 433 | 543 | 543 | unchanged (`unchanged` verdict at both refs) |

`junaxa` is closed on the criterion Batch 2 set, not on the score alone: its
body-group child count is **41** with histogram `g 7, rect 6, ellipse 2,
path 7, text 13, line 3, polygon 3` — the golden's, exactly — and after the
draw-order fix its child TAG SEQUENCE matches the golden at all 41 positions.

## 3. Every rise, with a verdict

Ten rises carry the adjudicator's own `artefact` verdict — score up, top-level
child distance DOWN — which is the case that instrument exists to sanction:

| fixture | score | child distance |
|---|---|---|
| `caluni-22-noci624` | 3024 → 3184 | 44 → 24 |
| `dugeki-47-celo546` | 7538 → 7546 | 78 → 77 |
| `gacujo-48-leto751` | 1239 → 1267 | 17 → 13 |
| `gijamu-35-vale058` | 2564 → 2608 | 33 → 27 |
| `lenoki-81-nofo984` | 889 → 933 | 9 → 3 |
| `mitefi-27-cubo687` | 2031 → 2047 | 24 → 22 |
| `peduzi-80-giki495` | 2032 → 2048 | 24 → 22 |
| `rujetu-45-laxe003` | 662 → 710 | 10 → 4 |
| `vucomo-53-gicu658` | 1970 → 1986 | 24 → 22 |
| `vuniba-19-repo187` | 494 → 510 | 5 → 3 |

Two rises land as `inconclusive` and are diagnosed below rather than left as a
label. The remaining 17 `inconclusive` rows are NULL at both refs — fixtures
that fail to render, identically before and after — and are not rises.

### 3a. `tukobo-89-zebi935` — 457 → 734, and it is not a participant defect

**Mechanism.** `ComponentRoseDivider#drawInternalU` draws FIVE elements —
`drawRectLong`'s full-width `URectangle(width, 3)`, `drawDoubleLine`'s TWO
`ULine.hline(width)` at `dy -1` and `dy +2`, a `URectangle(textWidth + 6,
textHeight)` label box, and the text. `renderer.ts#renderDivider` draws two:
one `<line>` and the text. So the port is short a 3px band rect, a label-box
rect and one rule — `rect 8 vs 10, line 7 vs 8` in this fixture's histogram,
with the golden's band at `y=150.5` and its `91.188 x 21` box at `x=163.658`.
That is the sequence DIVIDER/separator feature, not a participant glyph, and
it is unchanged at both refs.

**Origin.** The divider arm of the event pass; `skin/plantuml.skin`'s
`sequenceDiagram { separator { … } }`. Outside every write-set in this mission.

**Causal chain.** Our count went 44 → 41 at Batch 2, a delta of exactly `-3` =
the database glyph's five-element hand-rolled cylinder becoming two `UPath`s,
once (the fixture carries `hide footbox`). The golden's surviving three-element
surplus is the divider's 2 rects + 1 line. At `main` the two errors cancelled
and the aggregate count matched at 44 with a wrong composition.

**Ruled out.** A participant cause: the fixture's five participants are 4x
`participant` + 1x `database`, all dispatched; the rectangle dump shows our
four participant boxes against the golden's four, with the database a `<path>`
on both sides. The only unmatched rectangles carry `fill="#EEE"` and no
participant geometry.

### 3b. `gucare-93-petu502` — 1425 → 1428, a +3 coincidence on a 124-child document

**Mechanism.** Our output for this fixture already carries a structural deficit
unrelated to participants — 2 surplus `<rect>`, 1 surplus `<g>`, 3 missing
`<text>` — and that deficit is **byte-identical at `main` and now** (histogram
`ellipse 2, g 8, line 23, path 2, polygon 17, rect 16, text 56` at both refs,
against the golden's `… g 7, … rect 14, text 59`). With index alignment already
broken by those, moving the actor's label ahead of its glyph — correct per
`ComponentRoseActor.java:73-80` — re-indexes our children against the golden's
and two fewer positions coincide: matched tag positions 48/124 → 46/124.

**Origin.** Not the participant path. The surplus `rect`/`g` and the missing
`text` are present unchanged at both refs, so their origin is elsewhere in this
124-child document and is untouched by this mission.

**Ruled out.** An actor-drawing error: the actor's own attributes now MATCH the
golden that previously differed (head radius 10 → 8, `stroke-width` 1.5 → 0.5),
and `junaxa`, `cebeje-70-bada975` and `fenino-82-nusu462` — all of which
contain actors — match their goldens' tag sequences exactly after the same
change. Also ruled out: an element added or lost by this mission, since the
histogram is identical at both refs.

## 4. The measurement the adjudicator cannot make, and why it was needed

`weightedScore` rose on ~73 fixtures across `feat(T6)` + `fix(T4)` while those
fixtures got structurally CLOSER to their goldens. The adjudicator returns
`inconclusive` for all of them, because its proxy is the `svg/g[1][childCount]`
diff record and that record is absent whenever the child COUNT already matched
— which is exactly this class of change.

The mechanism is the metric's own, and it is stated in `compare.ts`'s header
from the other direction: the tag-mismatch short-circuits it was charging 12–15
apiece are gone (`junaxa` had 8 weighted diffs, it now has **0**), and the
subtrees they used to skip unexamined are now compared attribute by attribute
and report their real coordinate diffs.

The complementary measurement — body-group child TAG SEQUENCE against the
golden, which is the alignment the weighting is trying to proxy:

| ref | fixtures rendered | exact tag sequence | matched tag positions |
|---|---|---|---|
| `main` | 1122 | 506 | 48159 / 105874 |
| after Batches 1–3 (`74bc5c93`) | 1122 | 511 | 48327 / 105874 |
| after T6 + `fix(T4)` | 1124 | **576** | **49014 / 105901** |

`+70` fixtures whose child tag sequence now matches the golden exactly, and
`+855` matched positions, against `main`. Two fixtures that failed to render at
`main` (`nereka-67-deco609`, `tuzaga-87-gene496`) render now; that is reported
as measured and was not investigated.

## 5. Bottom line — can the orchestrator re-pin?

**Partially, and not by running the re-pin script wholesale.**

- Zero `regression` verdicts at both refs, and zero unadjudicated rises: every
  one of the 12 risers has a verdict (10 `artefact`, plus §3a and §3b).
- The 10 `artefact` rows and `gucare-93-petu502` are re-pinnable on the
  adjudicator's own rule.
- **`tukobo-89-zebi935` is not.** Its rise is a real, diagnosed structural gap
  (§3a) that this mission did not cause and did not fix, and re-pinning it
  would bake a known-unfixed deficit into the baseline. It was green at `main`
  only because two errors cancelled.
- `fobube-11-nifo424` and `rugeco-70-muro754` are untouched and stay red; both
  are filed as separate missions.

So: re-pin the 11, leave `tukobo` red with §3a as its record, or leave all 12
and carry the note. **That is a baseline write, so it is left to the
maintainer** rather than taken here — `repin-sequence-baselines.ts` was not
run, and no baseline JSON was edited by any task in this mission.
