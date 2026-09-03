# svg-activity conformance ratchet

Regression-proof gate for activity diagrams (`src/diagrams/activity/`),
mission `activity-oracle-harness`. Activity has its own dedicated upstream
engine and port pipeline (`parseActivity` -> `layoutActivity` ->
`renderActivity`, `src/diagrams/activity/{parser,layout/tile-layout,
renderer}.ts`), so this ratchet uses an activity-scoped render helper,
`tests/oracle/svg-conformance/render-fixture-activity.ts
#renderFixtureActivity`, rather than reusing another family's helper. This
is a **diff-baseline monotone-improvement ratchet** (D1), not a byte-freeze
golden ratchet: 0 of 373 sampled fixtures are zero-diff against the jar
today, so a freeze gate would gate nothing. See
`tests/oracle/svg-conformance/activity.diff-baseline.ratchet.test.ts`.

## Why a deterministic measurer, not production

Same rationale as every other family's README in this directory tree:
production (`renderSync`) always measures text with `jarMeasurer` (AWT font
metrics via the cached jar), a pre-existing, already-documented
apples-to-oranges gap, not evidence of a rendering bug.

## Why there is no AC3 (DOT-equal eligibility) here

Class/object/state gate promotion on a second condition beyond zero-diff:
the fixture's DOT emission must also be structurally `EQUAL` against the
oracle DOT (`parity-<type>.json`). Activity emits no DOT at all --
verified, not assumed (D9, `plans/activity-oracle-harness/decisions.md`):
zero `svek-*.dot` across 28 jar-rendered activity fixtures. Upstream
`activitydiagram3` never calls dot; its layout is the ftile/gtile system.
This is the identical DOT-less situation `sequence`'s own README documents
(and, before it, `json.golden.ratchet.test.ts` for json/yaml/hcl). No
`parity-activity.json` exists in this directory, and none should.

## How the population is typed

The committed cache is the population of record, not `tests/corpus/` (D3):
T0 typed every fixture through `registry.resolve` and captured only
`plugin.type === 'activity'`, so `test-results/dot-cache/activity/` is
reproducible on CI and `populate-corpus.py`'s own misclassifications (it
over-selects on a bare `A -> B` pattern) cannot silently change the gated
set.

Within that population, every fixture falls into exactly one of three
`diff-baseline.json` statuses, determined by the golden's and our own
render's content -- never by a slug list, which goes stale:

- **`jar-error`** (23 of 373) -- the GOLDEN itself is the jar's own
  graphical error page, detected by the same needle
  `routing-conformance.test.ts` and `refusal-coverage.test.ts` already use
  for this exact set (`PSystemError.header()`, `PSystemError.java:148-155`,
  and `ReportLog.anErrorHasOccurred`, `ReportLog.java:103-108`). The jar
  failing is no evidence about us (D12, added mid-mission -- not in the
  original T2 task spec). No `weightedScore`, no numeric `diffCount`. 8 of
  these 23 fixtures also have our OWN parser refusing the source; D12
  records the overlap as `jar-error`, not `error`, since the jar's own
  failure makes our outcome unevidential either way.
- **`error`** (82 of 373) -- our own parser refuses the source
  (`renderFixtureActivity` throws) and the golden is NOT a jar-error page,
  i.e. the jar rendered a real diagram we cannot yet produce (D8). These
  are real gaps in the port, not counted toward any numeric floor. A
  fixture that stops erroring is itself a reportable change, never silently
  read as "reached 0 diffs".
- **`baseline`** (268 of 373) -- both sides rendered a real diagram; the
  entry carries a numeric `weightedScore` (gated) and `diffCount`
  (informational).

23 + 82 + 268 = 373.

**Flagged for review:** the original T2 task spec and decisions.md D12's
own arithmetic both state the third figure as `373 - 23 - 90 + 8 = 283`.
That formula, evaluated literally, is 268, not 283 -- `373 - 23 = 350`,
`350 - 90 = 260`, `260 + 8 = 268` -- and 268 is exactly what direct
measurement over the committed corpus produces (23 jar-error total, 8 of
those overlapping the 90-count "our render errors" set, 82 error-only, 268
baseline). The two raw inputs the brief cites (23 jar-error, 90 our-error
including the 8-fixture overlap) both measure exactly as stated; only the
brief's derived total does not match its own formula. This was not
silently corrected -- see T2's own report for the measurement that
surfaced it.

## The gated quantity is `weightedScore`, not `diffCount`

Inherited from `plans/sequence-root-chrome/decisions.md` D5 via this
mission's D2. `compareSvg` (`compare.ts:437-480`) short-circuits on
node-type, tag and child-count mismatch, charging exactly 1 for each
however large the subtree it skipped -- so `diffCount` is **not monotone in
wrongness**: a document that becomes more structurally aligned can raise
its diff count. `weightedScore` charges each short-circuit an upper bound
on what descending could have cost, so it is monotone in alignment and is
what this ratchet gates. `diffCount` is retained purely as an informational
field.

**A RISEN `diffCount` beside a FALLEN `weightedScore` after T5's chrome fix
is the EXPECTED artefact of that weighting (D2), not a failure.** T5 routes
`renderActivity` through `assembleDocumentShell` (D6), which will collapse
the 12-marker `defs` short-circuit into a real comparison -- converting an
unexamined "cost 1" into its true per-attribute diff count.

## Current state (T2, pre-chrome baseline)

- **Corpus: 373 fixtures**, all committed at
  `test-results/dot-cache/activity/<slug>/`.
- **238 of the 268 `baseline` fixtures (89%) sit at exactly `diffCount =
  12`**, all sharing the IDENTICAL 12-path diff set:
  `svg/@background`, `svg/@contentStyleType`, `svg/@height`,
  `svg/@preserveAspectRatio`, `svg/@version`, `svg/@viewBox[2]`,
  `svg/@viewBox[3]`, `svg/@width`, `svg/@xmlns:xlink`, `svg/@zoomAndPan`,
  `svg/defs[1][childCount]`, `svg/g[1][childCount]` -- the same root-chrome
  family D6 targets. **This floor is NOT uniform across all 268**, as an
  earlier draft of the T2 task spec assumed ("every fixture currently sits
  at exactly 12 diffs"): 30 fixtures sit elsewhere (`diffCount` 10, 11, 29,
  34, 35, 40, 46, 55, 58, 63, 64, 72, 73, 74), and one fixture
  (`kodiji-34-mofe202`) sits at 11 -- the same 12-path set minus
  `svg/@background`, because that fixture's document never sets a
  background colour.
- **`weightedScore` over the 268 baseline fixtures: min 166
  (`kodiji-34-mofe202`), median 541, max 3076.**
- **ZERO fixtures reach 0 diffs.** `ratchet.json` ships with `fixtures: []`
  on purpose, not as a placeholder -- the promotion path (manifest schema,
  the branch-discrimination tests, the Add rule below) exists and is
  tested via fabricated in-memory branches, so it cannot be improvised
  later under time pressure. Promotion out of the diff-baseline is manual
  and belongs to a future rebuild mission, mirroring sequence's own stop
  13.

## Add rule

A fixture may be added to `ratchet.json` only when:

1. **Conformant** -- rendering the fixture's `in.puml` through
   `renderFixtureActivity` with `DeterministicMeasurer` produces an SVG
   that is zero-diff (`compareSvg(ours, golden, 'deterministic').pass ===
   true`) against the jar's `in.svg`.

(There is no second, DOT-equal condition -- see "Why there is no AC3"
above.)

To add a slug:

1. Confirm the condition above, e.g. via
   `npx vitest run tests/oracle/svg-conformance/activity.diff-baseline.ratchet.test.ts`
   and check for a `[PROMOTION READY]` log line naming the slug.
2. Copy `test-results/dot-cache/activity/<slug>/in.puml` and `in.svg` into
   `oracle/goldens/svg-activity/<slug>/` (renaming `in.svg` to
   `golden.svg`).
3. Append `{ slug, addedAt, source: "dot-cache" }` to `ratchet.json`.

## Remove rule

Removal is **maintainer-only** -- see `oracle/goldens/svg-description/
README.md`'s identical rule; the same rationale applies verbatim.
