## Observation: a 7-engine parallel survey produces false `timeout` regressions

- **Context**: T2c (mission `activity-divergence-drive-2`) ran a before/
  after `npm run svg:survey` across class/state/sequence/component/
  usecase/mindmap/object to satisfy the shared-core-touch requirement.
  The first attempt launched all 7 engines' survey processes in one shell
  command joined with `&` (background jobs) and `wait`.
- **Finding**: the "before" run (all 7 processes contending for CPU at
  once) reported dozens of fixtures per engine as `verdict: "timeout"`
  that the SAME worktree, surveyed again with the SAME code but engines
  run SEQUENTIALLY, resolved to their real verdict (`conformant`,
  `diverged`, etc.) — e.g. state's before/after diff showed 78 "changed"
  rows, every one of them `timeout → <real verdict>`, never `conformant →
  anything worse`. Diffing `before`/`after` naively would have reported
  these as the AFTER run's doing (since "before" has fewer resolved
  verdicts than "after"), when the actual cause was CPU contention in the
  "before" run itself, not the code change under test.
- **Impact**: when comparing two survey runs for a regression check,
  always filter out `timeout → X` transitions before concluding anything
  moved — they are a measurement artifact of concurrent load, not a code
  effect. Prefer running each engine's survey SEQUENTIALLY (one `npx jiti
  scripts/svg-parity-survey.ts <engine>` at a time) for any before/after
  comparison that must be trusted; parallelizing across engines is fine
  for a ONE-SIDED measurement (nothing to diff against) but corrupts a
  two-sided before/after diff. This generalizes the existing `confounded-
  wall-clock-readings.md` finding from timing numbers to PASS/FAIL
  verdicts.
- **Confidence**: High — reproduced once (7-way parallel before, 7-way
  sequential after, confirmed zero non-`timeout` verdict changes once the
  `timeout` noise is filtered; class/state re-surveyed sequentially a
  second time after all 5 commits landed, byte-identical conformant
  counts both times).
