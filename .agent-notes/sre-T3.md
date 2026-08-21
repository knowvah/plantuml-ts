# SRE T3 — narrow the globalSetup doc-comment claim

## Observation: comment claim was scoped too broadly

- **Context**: `tests/helpers/build-stdlib-globalsetup.ts`'s doc comment
  claimed "globalSetup completes before any worker spawns, so no test ever
  observes a half-rebuilt tree." Per D5 in `plans/stdlib-build-race/decisions.md`,
  this needed narrowing to its true scope after T0 proved a cross-process race.
- **Finding**: The claim is true only within a single vitest process. Across
  two concurrently-running `npm test`/vitest invocations sharing the same
  fixed, repo-absolute `packages/*/generated/` tree, `freshGeneratedDir`
  (`scripts/build-stdlib-packages.ts:42-47`) has no cross-process
  coordination, so a second process's `rmSync`-to-rewrite window can overlap
  the first process's in-flight `import()`, reproducing the same
  `Cannot find module '.../tupadr3.remote.js'` failure the comment implied
  was fully closed. This is the exact ambiguity that caused an earlier task
  (SI33) to scope its search to intra-process writers and stop with the real
  cause unfound (see `.agent-notes/sre-T0.md`).
- **Impact**: Fixed the comment only (no behavior change) so future readers
  don't repeat SI33's misdirected search. Verified via `git diff` that only
  ` *` comment lines changed, and `git diff --name-only -- src/` is empty.
- **Confidence**: High — mechanism, origin, and reproduction are documented
  with evidence in `.agent-notes/sre-T0.md`; this task only corrects the
  doc-comment's claimed scope to match that evidence.
