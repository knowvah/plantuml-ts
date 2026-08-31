# Adjudication — `sequence-divider-separator`

Measured 2026-08-31 on `feat/sequence-divider-separator` at `9313f9e5`,
working tree clean, against `main` (`a49c6998`). Every number is from this
run. Executed directly rather than from a `plans/` brief — three tasks against
one upstream component — so this file is the mission's only artefact besides
the code; the approved plan is
`~/.claude/plans/partitioned-napping-matsumoto.md`.

Instrument: `npx jiti scripts/sequence-ratchet-adjudicate.ts --base a49c6998`,
`--base` alone. All measurement went through `renderFixtureSequence` +
`DeterministicMeasurer` + `fixtureIncludeStore()` explicitly; the throwaway
scripts were deleted.

## 1. The verdict split

| fixtures | skipped | regression | artefact | substructure | improved | inconclusive | unchanged |
|---|---|---|---|---|---|---|---|
| 1141 | **0** | **3** | 19 | 0 | 14 | 17 | 1088 |

17 of the `inconclusive` rows are NULL at both refs — fixtures that fail to
render, unchanged by this work.

## 2. The closing criterion: `tukobo-89-zebi935`

**Met.** 734 → **369**, child distance 3 → null, and its body-group histogram
is now the golden's exactly: 44 children, `g 6, line 8, path 3, polygon 4,
rect 10, text 13`. That was the stated pass/fail condition, measured from the
histogram rather than the score.

`fobube-11-nifo424` (375) and `rugeco-70-muro754` (433) are `unchanged`.

## 3. The three `regression` verdicts — diagnosed, not labelled

`digula-66-dipe776` (903 → 975), `vogegu-91-mave762` (529 → 553),
`xedomi-77-libu804` (783 → 879).

**Mechanism.** All three documents were ALREADY larger than their golden at
`main`, for reasons unrelated to dividers. Adding the four elements a correct
divider gains therefore pushes the top-level child distance further UP, and
`classify` (`scripts/sequence-ratchet-adjudicate.ts:181-190`) has no rule that
can fire when the distance rises — it falls through to `regression`. This is
the exact limitation `DIVERGENCES.md`'s "Background-pass rollout" entry
already documents, from the same direction: a correct node added to an
already-oversized document.

**Origin.** Not the divider. Measured at both refs in a detached worktree:

| fixture | ours @ `main` | ours now | golden | Δ | dividers |
|---|---|---|---|---|---|
| `digula-66-dipe776` | 66 | 75 | 50 | +9 | 3 |
| `vogegu-91-mave762` | 31 | 34 | 28 | +3 | 1 |
| `xedomi-77-libu804` | 52 | 64 | 48 | +12 | 4 |

**Causal chain.** Δ is exactly `+3 × (number of dividers)` in all three — the
divider going from two drawn elements to five. Each was over its golden BEFORE
this change (66 > 50, 31 > 28, 52 > 48). `digula` and `xedomi` both carry
`newpage`: the jar renders page 1 only and this port renders every page into
one document, which is the already-filed `sequence-newpage-pagination` gap
(the same mechanism as `fobube-11-nifo424`). `vogegu` has no `newpage`; its
surplus is 2 `line`, 2 `polygon` and 2 `text`, all present at both refs, from
this port's arrowhead emission — the jar draws no `polygon` in that fixture at
all.

**Ruled out — a defect in the divider itself.** `vogegu`'s divider now matches
its golden's element for element and number for number: band `height="3"`,
`fill="#EEE"`, `stroke-width="1"`; label box `97.931 × 21` against the
golden's `97.931 × 21`. Its `rect` count went 6 → 8 against the golden's 8,
i.e. it now agrees. Only the x/y offsets differ, and those are the known
`LEFT_MARGIN` 30-against-10 divergence. The same box-dimension match holds
exactly on `pigifu-13-kele137` (`40.813 × 34`) and `tukobo-89-zebi935`
(`91.188 × 21`).

## 4. The 19 `artefact` rows

Every one has a FALLING child distance, which is the case the adjudicator
exists to sanction. The largest falls: `lugika-07-rozo911` 11 → 2,
`lokavu-60-peku948` 21 → 6, `mukebo-35-xoju095` 22 → 7,
`rapoto-38-neca900` 41 → 32, `pigifu-13-kele137` 5 → 1.

## 5. The structural measurement the score cannot make

Body-group child TAG SEQUENCE against the golden — the same census
`sequence-participant-symbols` §4 introduced, because `weightedScore` rises
whenever a short-circuit is replaced by real per-attribute comparison:

| ref | rendered | exact tag sequence | matched positions |
|---|---|---|---|
| `main` (`a49c6998`) | 1122 | 574 | 48987 / 105874 |
| this branch | 1124 | **589** | **49909 / 105901** |

`+15` fixtures whose child tag sequence now matches the golden exactly, and
`+922` matched positions.

## 6. Bottom line — can the orchestrator re-pin?

**Not without a decision, and not wholesale.**

The sequence ratchet goes from **3 red to 24**. `tukobo` is fixed and drops
off; 21 rows are added — the 19 `artefact`s plus `digula` and `xedomi`, with
`vogegu` among them.

- Zero rises are unadjudicated: 19 carry the tool's own `artefact` verdict and
  3 carry §3's diagnosis.
- The 19 `artefact` rows are re-pinnable on the adjudicator's own rule.
- **`digula-66-dipe776` and `xedomi-77-libu804` should NOT be re-pinned**:
  their surplus is the `newpage` pagination gap, a real unfixed deficit, and
  re-pinning would bake it in — the same call made for `tukobo` last mission.
- `vogegu-91-mave762` is the genuinely awkward one. Its divider is exact and
  its residual surplus is the arrowhead-emission gap, which no mission owns
  yet. Re-pinning it records a number dominated by an unfiled gap; leaving it
  red keeps a row whose stated cause is not the divider.

No baseline JSON was edited and `repin-sequence-baselines.ts` was not run.

## 7. Filed by this work

- **Frame-header labels do not split on `\n`.** `pigifu-13-kele137`'s
  `group foo\ndummy` draws ONE `<text>` here and two in the jar. Same
  `Display.getWithNewlines` mechanism the divider now honours, in
  `ComponentRoseGroupingHeader`. Not fixed here — out of this component.
- **`\t`, `\\`, `\r`, `\l` escapes** are unhandled in every sequence label,
  divider included. Engine-wide, deliberately not made a divider special case.
