# sdd3 — sequence-divergence-drive-3 execution notes

Observations from running `plans/sequence-divergence-drive-3/` (2026-10-22 →
2026-10-24). Facts only; the decision journal holds the reasoning.

## Observation: every measuring instrument must share the harness options
- **Context**: batch 6 added `filename: 'in.puml'` and a remote-image store
  to `sequenceFixtureOptions()`; classify/diff-one moved tifube and fifasu
  to zero while the survey, the `surveyAssetStore()` mirror and the re-pin
  snapshot still rendered without them (journal rows 83–85).
- **Finding**: `scripts/svg-parity-survey.ts`, `render-fixture-utility.ts#
  surveyAssetStore()` and `scripts/sequence-repin-snapshot.ts` each build
  their own render options; a new option reaches none of them by itself.
- **Impact**: survey ⇔ classify disagreement (the brief's stop 12) appears
  one close later unless every instrument is updated with the harness.
- **Confidence**: High.

## Observation: the pin ratchet is compareSvg-zero, not byte equality
- **Context**: three pinned cerulean rows changed bytes under T3b (numbers
  formatted once after the scale) and the golden ratchet stayed green.
- **Finding**: `sequence.golden.ratchet.test.ts` asserts `compareSvg(ours,
  golden, 'deterministic')` has no diffs against the JAR's SVG; our bytes
  may move toward the jar without touching the pin.
- **Impact**: a byte change on a pinned row is not by itself a regression;
  judge it by direction (toward the jar) and mechanism (journal row 56).
- **Confidence**: High.

## Observation: a pure move from string emitters to klimt drivers changes bytes
- **Context**: batch 8 moved sequence drawing through `UGraphic`.
- **Finding**: the core drivers mirror `SvgGraphics`' attribute form
  (`DriverPolygonSvg` writes `style="stroke:…"`, text attributes in the
  jar's order) while the string emitters wrote plain attributes; raw hash
  identity is impossible for a faithful move. A canonical form (drop the
  `<?plantuml-src?>` PI, expand `style=`, sort attributes, decode nested
  `data:image/svg+xml;base64` payloads recursively) is form-insensitive and
  value-sensitive; `plans/…/tools/svg-hashes.mts --canon / --canon-all`.
- **Impact**: hash gates for refactors of emitters need the canonical mode;
  nested-diagram payloads and unknown-bucket rows carry sequence output.
- **Confidence**: High (D5 Amendment 1, rows 93–97).

## Observation: `merge-one.sh` refuses a dirty tree, and the cleanup runs anyway
- **Context**: T8g's merge (row 104).
- **Finding**: an uncommitted plans/ edit made `git diff HEAD` non-empty;
  the script printed `DIRTY tree, refusing` and the orchestrator's chained
  `git branch -D` still deleted the task branch. The commit object survived
  and was merged by sha.
- **Impact**: commit plans/ edits before the merge step; never chain the
  branch deletion on the same line as the merge.
- **Confidence**: High.

## Observation: `git add <plans dir>` sweeps in-progress chain outputs
- **Context**: b3 and b4 closes (rows 56, 67 amended commits).
- **Finding**: `chain.sh` writes `bN-eng/parity-*.json` while running; a
  `git add plans/…` during the run commits partial measurement outputs.
- **Impact**: add explicit paths while a chain runs.
- **Confidence**: High.

## Observation: the text driver's measurement is invisible to every gate
- **Context**: T8c (row 98).
- **Finding**: `driver-text-svg.ts` measured with family+size only (the jar's
  `FontConfiguration#getFont()` folds bold/italic in) and dropped
  `svgAttributes`; every gate uses `DeterministicMeasurer`, which does not
  distinguish weight, so the defect never showed. Fixed in `6e9b69ad8`.
- **Impact**: production (jar-metric) text widths can differ from what the
  gates prove; a production-metric spot check is the only witness.
- **Confidence**: High on the mechanism; the production effect on other
  engines is toward the jar by construction but unmeasured.

## Observation: sonnet agents' gate claims need one independent check each
- **Context**: T8a claimed core drivers emit `style=` for every shape (true
  only per driver); T8b/T8c/T8g claimed canonical equality for movers.
- **Finding**: each claim was re-measured by the orchestrator (form check on
  a class render; decoded-payload equality; the `Z ` byte on two rows) before
  the gate or decision was amended; every claim held after re-measurement,
  one was over-general.
- **Impact**: cheap to verify, costly to inherit wrong.
- **Confidence**: High.

## Observation: journal timestamps drift from the clock
- **Context**: rows 53–68 (row 69 note).
- **Finding**: the orchestrator's estimated times ran up to three hours
  ahead; commit times (`git log --date`) are authoritative.
- **Impact**: stamp rows from `date`/commit times, not estimates.
- **Confidence**: High.
