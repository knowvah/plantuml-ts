# `test-results/render-manifest-baseline.json` is gitignored and has never
# been committed

Found by T5 of `sequence-root-chrome`, 2026-08-23, and verified by the
orchestrator before acting on it.

## Observation: a brief asked for a commit of a file git refuses to stage

- **Context**: T5's spec said "commit the new baseline" and diff against
  "the committed baseline". The file is neither.
- **Finding**: `.gitignore:24` is `test-results/*`, with `:25`
  `!test-results/dot-cache/` as the single deliberate re-include. So the
  manifest baseline is ignored. `git cat-file -e HEAD:<path>` fails,
  `git log --all -- <path>` is empty for the repo's entire history, and
  `git add <path>` is refused. The `.gitignore:19-23` comment justifies the
  dot-cache exception specifically — regenerating it needs Java, the pinned
  oracle jar and the pdiff corpus, none of which exist on a CI runner. That
  rationale does not extend to the manifest baseline, which regenerates in
  ~14 s from a clean checkout using only the already-tracked `dot-cache` and
  `oracle/goldens`.
- **Nothing reads it**: `grep -rn 'render-manifest-baseline' tests/ scripts/
  src/ .github/` returns nothing. The only `render-manifest` consumers are
  `scripts/render-manifest.ts` and `tests/unit/scripts/render-manifest.test.ts`.
  It is an **operator-driven guard**, not a pinned artifact a gate enforces.
- **Impact**: any future brief listing this path in a write-set and asking
  for a commit produces either an empty commit or an unsanctioned
  `git add -f`. Record the sha256 and the diff summary in the decision
  journal instead (the SI28/SI31 pattern). Do **not** reach for SI32's
  tracked-copy-under-`tests/fixtures/` pattern by analogy: that existed
  because a *test* read the harness baseline, which is not true here.
  `plans/state-declared-size-fix/batch-0/overview.md:7` already annotated
  this exact path "(both gitignored)" inside a write-set, so the knowledge
  existed and was lost between missions — which is why it is here.
- **Confidence**: High (git history, `.gitignore` trace and a repo-wide
  consumer grep all checked directly).

## Observation: the `coverage/.tmp` race kills a second concurrent `npm test`

- **Context**: T5 ran `npm test` while T4's suite was live.
- **Finding**: the run aborts with `Something removed the coverage directory
  ".../coverage/.tmp"` / `ENOENT coverage-*.json` and exits 1 **with no
  `Test Files` summary line**, so exit code alone cannot distinguish it from
  a real failure.
- **Impact**: parallel batch tasks must not both run `npm test`. The tell is
  the absent `Test Files` line. Matches the open follow-on recorded in
  `stdlib-run-isolation`.
- **Confidence**: High (reproduced once, and the re-run serially was clean).
