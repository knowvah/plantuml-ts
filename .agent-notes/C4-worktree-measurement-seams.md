## Observation: a detached worktree needs assets/stdlib symlinked, not just node_modules

- **Context**: C4 of `plans/sequence-text-and-y-convergence` — measuring the
  axis-split distance instrument at a base commit, by copying
  `scripts/sequence-geometry-distance.ts` into a `git worktree --detach` tree.
- **Finding**: `node_modules` must be symlinked (otherwise `katex` fails to
  resolve and every render throws). Symlinking only that is NOT enough:
  `assets/stdlib/` is also absent from a fresh worktree, and its absence does
  not fail loudly. The two stdlib-include fixtures in the sequence corpus,
  `nereka-67-deco609` and `tuzaga-87-gene496`, silently become
  `Fatal parsing error`; the instrument reports `measured=1122 errored=19`
  instead of `1124`/`17`, and total distance reads 3 747.482 low. With both
  symlinks the run reproduced the recorded checkpoint figures to the digit.
- **Impact**: any base-vs-live corpus measurement taken in a worktree without
  `assets/stdlib` is a different population from the one the gates measure.
  `scripts/sequence-ratchet-adjudicate.ts` builds its own worktree and is
  unaffected; hand-rolled ones are.
- **Confidence**: High — measured both ways, difference isolated to the two
  fixtures.

## Observation: the re-pin script's RAISED set is not the adjudicator's rise set

- **Context**: same task. Adjudication against the batch's own base found 8
  rises; the re-pin raised 74 pins.
- **Finding**: not a contradiction. `repin-sequence-baselines.ts` compares
  each fixture to its PIN, and pins are heterogeneous — this baseline carried
  ten distinct `measuredAgainstCommit` values spanning six days. 73 of the 74
  had already risen before the batch began. Re-rendering each fixture at its
  own `measuredAgainstCommit` (worktree + both symlinks above) reproduced all
  73 pinned scores exactly, which both confirms pin integrity and locates the
  rise outside the batch.
- **Impact**: the `repin-script-raises-preexisting-red-pin` note's check is
  necessary but not sufficient. To answer "did MY change raise this pin",
  measure at the pin's own commit; a single adjudication base cannot settle a
  baseline whose pins were taken at different commits.
- **Confidence**: High — 73 of 73 exact reproductions.
