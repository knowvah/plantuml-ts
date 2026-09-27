## Observation: checked-in parity-<type>.json baselines can be stale relative to HEAD

- **Context**: cdd4-T9 (lecelo-92-loma110 emoji-artwork fix). Diffed the
  committed `tests/oracle/svg-conformance/parity-<type>.json` files against
  a fresh full-corpus survey run on the T9 tree to find "movers" caused by
  adding the emoji asset store to `scripts/svg-parity-survey.ts`.
- **Finding**: that diff reported ~400 movers across 9 engines (component
  alone: 124), including one apparent REGRESSION
  (`unknown/jititi-15-maxe512`, `structural-match` -> `diverged`,
  `dotEqual` True -> False). Re-measuring with `git stash` (true before =
  same commit, no T9 changes; true after = full T9 tree) instead of the
  checked-in JSON as "before" collapsed the real, isolated mover count to
  **2** (`class/lecelo-92-loma110` and `component/murava-69-tago286`, both
  improvements, zero regressions). `jititi-15-maxe512` does not move at all
  under the isolated measurement — direct `renderSync` comparison confirmed
  its SVG output is byte-identical with or without the emoji store. The
  checked-in parity JSONs simply predate several already-merged cdd4
  batch-1/batch-2 tasks on this branch and were never the true "before".
- **Impact**: never diff a generated/committed measurement file against a
  fresh run to isolate ONE change's effect unless you know the committed
  file was generated from the SAME commit you're diffing against. Use
  `git stash` (or an equivalent same-commit re-run) to get a true isolated
  before/after when the committed artifact might be stale — this is the
  same family of defect as `measurement-artifacts-outnumber-defects.md` and
  `repin-script-raises-preexisting-red-pin.md`.
- **Confidence**: High (reproduced twice; direct render comparison
  corroborates the isolated-diff result for the one apparent regression).
