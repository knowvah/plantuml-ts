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

## Current state (T6, post-chrome)

- **Corpus: 373 fixtures**, all committed at
  `test-results/dot-cache/activity/<slug>/`. The three-way status split is
  unchanged by T5: **268 `baseline` + 82 `error` + 23 `jar-error`**, with
  **zero status transitions** at the T6 re-measurement (in particular, no
  `error` fixture started rendering -- D8's reportable transition did not
  occur).
- **The descent.** Aggregate `weightedScore` over the 268 fell **154722 ->
  108447, -29.9%**. **268 fixtures fell, ZERO rose, none held.** D13
  pre-declared ~20 risers (the fixtures whose `g[1][childCount]` was equal
  only because two chrome rects masked a two-element deficit); they fell
  instead. Pre-declaring the set cost nothing and would have caught a real
  regression -- it is recorded as a conservative forecast, not a miss.
- **`diffCount` rose on 57 and fell on 211.** This is the D2 artefact,
  stated in advance: collapsing the 12-marker `defs` short-circuit into a
  real comparison converts an unexamined "cost 1" into its true
  per-attribute count. It is not a regression, and it is not gated.
- **T2's 12-path floor is gone.** Of that set, exactly three paths survive
  anywhere in the corpus, each on exactly ONE fixture, and each a VALUE
  difference rather than an absent attribute:
  `svg/@background` on `levuma-67-cego489`, `svg/@preserveAspectRatio` on
  `setecu-78-cuko533`, and `svg/defs[1][childCount]` on
  `dakesa-98-mano758`. See `diff-census.json#namedFamilies` for each
  mechanism.
- **Verified directly, not inferred from the absence of a diff:** all 268
  emit all seven root attributes AND `data-diagram-type="ACTIVITY"`; our
  `defs` is empty on all 268; the jar's is non-empty on exactly one
  (`dakesa-98-mano758`, a `red-green` gradient it expands into a
  `<linearGradient>`).
- **`weightedScore` over the 268 now ranges min 17, median 366, max 2922**
  (was min 166, median 541, max 3076).
- **ZERO fixtures reach 0 diffs**, so `ratchet.json` still ships with
  `fixtures: []` -- see the Add rule below for what would change that.

## Where the residual lives -- `diff-census.json`

`diff-census.json` is the work queue for the next mission: every remaining
diff path, normalised (positional indices replaced by `[]`) and **ranked by
the weight it carries, not by how often it appears**. Ranking by occurrence
would put `svg/@viewBox[]` (527 records, 0.5% of the residual weight) above
`svg/g[][childCount]` (209 records, **91.6%**) and point the next mission at
the wrong work.

Two findings that shape that queue:

- **`svg/g[][childCount]` is 91.6% of what is left, and it is missing ink,
  not chrome.** 190 of the 268 draw FEWER children than the jar; 59 match;
  19 draw more (9 still at exactly +2). D13 measured the PRE-T5 split as
  168 / 20 / 80 with 55 at +2 -- T5 removed the two background rects, which
  is why the +2 cohort collapsed and the equal cohort grew. A `[childCount]`
  mismatch short-circuits the whole subtree, so closing this gap is worth
  more than every attribute family beneath it combined.
- **The geometry residual goes BOTH WAYS, and `diff-census.json` records a
  direction per fixture for exactly that reason.** Width: 195 of 268 wider
  than the jar, 73 narrower, none equal. Height: 105 taller, 154 shorter, 9
  equal. `numalo-91-pole243` is 52 wide against the jar's 64;
  `darote-51-kuta407` is 144 against 129. A census reporting only magnitude
  would send the next mission hunting a constant margin that does not
  exist. `viewBox[2]`/`viewBox[3]` are byte-identical to `width`/`height` on
  our side across all 268 (verified), so they are the same measurement
  reported twice.

**Correction to the T5 decision-journal entry, verified at T6:**
`velodu-59-sada437` is NOT a second instance of the dark-theme
resolution gap. Its golden is the jar's own graphical error page (its
`#000000` background is that page's styling, not a resolved theme), it is
pinned `status: "jar-error"`, and it contributes no number to any measurement
here. `skinparam mode dark` occurs on exactly ONE fixture in the whole
373-fixture corpus, `levuma-67-cego489`.

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

## `activity-element-granularity` close-out — 2026-09-03

Converged activity's SVG **element vocabulary** with the jar's: one
`<polyline>` → N `<line>` per segment (T1), `<circle>` → `<ellipse>` (T2),
one `<text>` with `<tspan>` children → N `<text>` per label line (T3).
Full report: `.agent-notes/aeg-T4.md`, mission brief
`plans/activity-element-granularity/`.

**Headline: Σ`weightedScore` over the 268 numerically-comparable fixtures
108447 → 61677, −43.1%. Zero fixtures rose against the mission-start
pin.** `svg/g[][childCount]`'s share of total weight fell from **91.6%
(this file's own prior headline) to 39.9%**.

The mission's own premise-check landed too: the residual was measured to
be a **different element vocabulary for the same drawn content**, not
"missing ink" as `planning/next-missions.md` had described it — the 91.6%
figure above was never about unported activity content.

Ten fixtures rose at an intermediate checkpoint mid-mission (element-count
convergence exposing six unrelated pre-existing defects — note-after-
terminal sizing, unwired diamond/font skinparams, swimlane rendering
architecture, nested-split geometry, embedded diagrams in labels, note
width/overscan); all ten finished net-improved against the mission start.
Six defects filed as named follow-ons in `planning/next-missions.md`,
alongside a seventh (`activity-edge-stroke-width`) found by T4's own
re-census. None fixed in this mission — element vocabulary only.

`oracle/goldens/svg-activity/diff-census.json` and `element-baseline.json`
are current as of this close-out (`measuredAgainstCommit` in each file).
