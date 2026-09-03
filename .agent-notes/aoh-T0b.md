# Adding a corpus tree trips two gates no mission owns

`activity-oracle-harness` / T0b, 2026-09-02.

## Observation: a new `dot-cache/<type>/` tree turns two gates red on contact
- **Context**: T0 captured 373 activity fixtures into
  `test-results/dot-cache/activity/`. Nothing in the mission touched
  `routing-conformance.test.ts` or `refusal-coverage.test.ts`.
- **Finding**: both walk the whole `test-results/dot-cache/**` tree
  (`readdirSync(CACHE_ROOT)`) and FAIL on any fixture with no baseline entry.
  Adding a tree therefore makes each report N unpinned fixtures. Neither
  baseline appeared in any write-set across the mission's six batches, so
  the blocker was invisible at decomposition.
- **Impact**: **any** future mission that captures a new corpus type inherits
  this. Budget a pinning task for both baselines from the start, and put it
  BEFORE the capture commit — both gates read the DISK tree, not the committed
  one, so pinning first keeps every commit green while committing the cache
  first lands a red one.
- **Confidence**: High — reproduced, fixed, and both gates re-run green.

## Observation: the gates forbid the cheap fix in their own failure text
- **Context**: the obvious shortcut is to exclude the new tree from the walk.
- **Finding**: both assertion messages say *"Measure and pin them — do not
  narrow the walk"*, and give the reason: an un-measured fixture is exactly
  how the original 86 misroutes survived indefinitely, because every one of
  them still rendered.
- **Impact**: treat the walk as non-negotiable. The work is measuring, not
  scoping.
- **Confidence**: High — quoted from the failing output.

## Observation: 373 unpinned fixtures were TWO judgments, not 373
- **Context**: the fear was per-fixture adjudication, since a
  `known-misroute` pin requires a reason citing an upstream `File.java:line`.
- **Finding**: measured through the gates' own seams, the activity tree is
  uniform — `ourType` is `NONE` for **all 373**, and every non-error golden
  says `ACTIVITY`. So 350 pins share one mechanism
  (`src/diagrams/activity/renderer.ts:221-226` stamps no `diagramType`;
  `TextBlockExporter.java:293` is where upstream does), and the other 23 are
  jar error pages needing no reason at all.
- **Impact**: measure the distribution BEFORE estimating adjudication cost. A
  tree that is uniform in the gated quantity collapses to one decision.
- **Confidence**: High — measured twice, by two independent scripts, agreeing.

## Observation: additive-only is provable, and worth proving
- **Context**: the standing hazard in this repo is a re-pin silently raising a
  pre-existing red pin (`.agent-notes/sequence-newpage-repin-hazard.md`).
- **Finding**: that hazard cannot apply to a tree with no pins — but the proof
  is cheap and worth keeping. `git diff --numstat` on both baselines shows
  `4103 0`, i.e. zero deletions, and the script asserts the pre-existing
  prefix is byte-identical before writing.
- **Impact**: for an ADD, assert zero deletions rather than reasoning that a
  raise is impossible.
- **Confidence**: High.
