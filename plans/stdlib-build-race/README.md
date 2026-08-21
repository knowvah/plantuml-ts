# Mission: stdlib-build-race

**Diagnose the 1-in-7 `stdlib-remote-e2e` intermittent, then fix it.** The
failure was left OPEN and undiagnosed by SI33 (`sequence-oracle-harness` T2)
because "two attempts failed" is not a diagnosis and neither is "flake". This
mission produces the mechanism first, and only then a fix.

**Branch:** `fix/stdlib-build-race` (from `main` at or after `0e6293ef`)
· **Merge:** merge commit · **Agents run no git** — the orchestrator commits
each task by pathspec.

## The symptom, as recorded

2 tests in `tests/integration/stdlib-remote-e2e.test.ts` fail with
`Cannot find module .../packages/stdlib-tupadr3/generated/tupadr3.remote.js`,
in 1 of 7 full-suite runs. **The file's mtime was inside the failing run** —
`globalSetup` DID write it; the worker still could not resolve it.

Already ruled out by SI33, with evidence, in `.agent-notes/g1h-T2.md`:
T2's write-set · a second in-run writer (`buildStdlibPackages` has exactly one
caller, `tests/helpers/build-stdlib-globalsetup.ts:87`) · `prepack` (targets
`assets/`, not `generated/`) · the preceding `npm run build` (controlled
experiment, negative).

## The hypothesis this mission must prove or kill

`freshGeneratedDir` (`scripts/build-stdlib-packages.ts:42-47`) opens with
`rmSync(generatedDir, { recursive: true, force: true })`. `generatedDir` is a
**fixed repo-absolute path** built from `__dirname` —
`<REPO_ROOT>/packages/<pkg>/generated/`, gitignored at `.gitignore:70`. Every
concurrent `npm test` therefore shares one mutable tree.

`build-stdlib-globalsetup.ts`'s own doc comment states the guarantee that made
SI33 scope its search too narrowly: *"globalSetup completes before any worker
spawns, so no test ever observes a half-rebuilt tree."* That is true **within
one vitest process**. It says nothing across **two concurrent vitest
processes**.

**Proposed mechanism:** Run B's `globalSetup` `rmSync`s the tree while Run A's
worker is importing out of it. It fits every recorded fact — the mtime inside
the run (A wrote it), the unresolvable import (B deleted it), and the failing
run being the only one at load1 ~17 and the slowest (59.96 s vs 53.92–55.82 s).
SI33's agents demonstrably ran `npm test` concurrently during that session.

**This is a hypothesis, not a finding.** T0 proves it or the mission pivots.

## Batches

| Batch | What | Tasks | Done |
|---|---|---|---|
| [0](batch-0/overview.md) | Reproduce deterministically — **PIVOT GATE** | T0 | [x] |
| [1](batch-1/overview.md) | Commit the repro, env-guarded | T1 | [x] |
| [2](batch-2/overview.md) | Up-to-date skip · globalSetup doc (PARALLEL) | T2, T3 | [ ] |
| [3](batch-3/overview.md) | Cross-process lock with stale recovery | T4 | [ ] |
| [4](batch-4/overview.md) | Verify, document the residual hole, close out | T5 | [ ] |

Batch 2 is the only parallel batch. Everything else is inherently serial:
diagnosis gates the fix, and T2/T4 write the same file.

## Quality gates (after every batch)

```
- command: npm test
  pass: exit 0 (coverage >= 90/90/90)
  on_fail: fix_and_rerun
- command: npm run typecheck
  pass: exit 0 (both tsconfigs)
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0 (3 pre-existing [unplugin:dts] notes are NOT a failure)
  on_fail: fix_and_rerun
- command: git diff --name-only -- src/
  pass: EMPTY. Any output is stop 2.
  on_fail: stop
- command: npx jiti scripts/render-manifest.ts --out /tmp/sbr-manifest.json && python3 plans/state-declared-size-fix/scripts/manifest-diff.py test-results/render-manifest-baseline.json /tmp/sbr-manifest.json plans/stdlib-build-race/expected-moves.txt
  pass: "0 unexpected"
  on_fail: stop
```

**Wall-clock ceiling: 60.3 s.** Measured at planning time on the unchanged
tree: **58.62 s at load1 7.00** — about **1.7 s of headroom**, not the ~3 s
the ceiling was originally set against (55.4–55.8 s at load1 ~4, 2026-08-20).
The difference is machine conditions, not the tree. Two consequences:

- The margin is thin. T1's repro test MUST stay skipped by default (D4), and
  T2/T4's unit tests must be cheap.
- Measure on a SETTLED machine and **report the load with the number**. This
  repo has burned four separate investigations on confounded readings —
  sibling agents, a Spotlight reindex of new files, WebStorm indexing, and
  ambient browser load. A number without a load reading is not evidence.

If a batch exceeds 60.3 s, first re-measure at low load before treating it as
stop 8.

## Stop conditions

1. **T0 cannot reproduce the race.** The hypothesis is then wrong. STOP,
   report, and do not proceed to any fix — pivot to instrumenting
   `globalSetup` completion vs. worker spawn ordering (SI33's untested
   hypothesis). Do NOT bend evidence to fit the hypothesis.
2. **Any `src/` file is modified.** This is test infrastructure. Zero
   tolerance.
3. Two consecutive gate failures on the same check.
4. A task must write a file outside its write-set that no task owns.
5. The up-to-date predicate would skip a build on anything other than
   content (a file count or an mtime) — that is the stale-oracle failure
   class this repo has already been bitten by (D3, D4).
6. The lock can wedge a future run (no stale-lock recovery, or an unbounded
   wait). Converting a 1-in-7 flake into a permanent hang is strictly worse
   than the bug.
7. A finding contradicts a locked decision (D1–D5).
8. `npm test` exceeds 60.3 s on a settled machine.
9. Same location changed 3x consecutively without the check clearing.

## Push forward (journal the call)

Harness shape and filenames · the lock's on-disk representation · the hash
algorithm for the up-to-date predicate · probes under `scripts_scratch/T<N>/`,
deleted before commit · a repro that needs more than 5 attempts to fail
(record the rate and continue) · minor/patch dep bumps.

## Index

- [decisions.md](decisions.md) — D1…D5 (locked) ·
  [decision-journal.md](decision-journal.md) ·
  [expected-moves.txt](expected-moves.txt)
- [diagrams/data-flow.md](diagrams/data-flow.md) ·
  [diagrams/component-map.md](diagrams/component-map.md)
- **Source record:** `.agent-notes/g1h-T2.md` "Observation: a 1-in-7
  `stdlib-remote-e2e` failure — OPEN, mechanism NOT isolated" ·
  `planning/next-missions.md`
- Precedents: si11a T8 and SI12 T8 closed the SAME error class on a
  different concurrency axis — read
  `tests/helpers/build-stdlib-globalsetup.ts`'s doc comment in full.
