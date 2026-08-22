# Mission: test-budget-invariant

**A lock-using test whose timeout is shorter than the lock's own `maxWaitMs`
can never report the lock's designed error. Make that structurally
impossible, and fix the two tests where it already bit.**

SI36 (`stdlib-lock-sharing`, merged `eeaa8ca8`) closed the build-lock timeout
defect. While verifying it, two tests were seen failing under concurrent load
with vitest's **default 5,000 ms** budget. That observation was recorded as
"tracks machine load". **Investigation before this brief showed that is only
half true, and the more important half is a defect.**

## The mechanism, already root-caused

`tests/unit/stdlib-packages.test.ts` — two sibling tests in one `describe`,
both calling `npmPackDryRun` (which holds the build lock **and** spawns
`npm pack --dry-run`):

| Line | Test | Budget | Quiet runtime | Ever failed? |
|---|---|---|---|---|
| 408–428 | `packages/$packageDir stays under $ceilingMb MB` | **120,000 ms** | 1048 ms | no |
| **429** | `packages/stdlib-all ships a LICENSE...` | **none → 5,000 ms default** | 187 ms | **yes** |

SI35 raised the budget on one `npm pack` test and **missed the adjacent one**.
The 5x *slower* sibling never failed because it has **24x the budget**. This is
an omission at `tests/unit/stdlib-packages.test.ts:429`, not a load
phenomenon — load only realises a tail the sibling's own comment already
documents ("measured standalone at 12.1 s").

## The invariant this mission installs

`acquireBuildLock` waits up to `DEFAULT_MAX_WAIT_MS` (30,000) before throwing.
So any test that acquires the lock and declares a budget **below** 30,000 ms
**dies before the lock can report**, and the real failure arrives disguised.
The sibling's comment records exactly this happening once already: *"a TIMEOUT
wearing the costume of a packaging failure."*

Two instances, two missions, same shape. It should be a gate, not a comment.

## SI36's close-out recommendation is wrong — correcting it is in scope

SI36's close-out calls 120 s "provably over-provisioned" and proposes lowering
it, reasoning from a max **wait** of 12,818 ms against 120 s (~9x slack).
**That double-counts nothing and omits half the budget.** A lock-using test
must cover **wait + hold**: the lock permits 30,000 ms of waiting, and T4
measured a max **hold** of 20,029 ms. Legitimate worst case is ≈50 s, so 120 s
is ~2.4x — defensible, not slack.

**Lowering the 120 s values is therefore OUT OF SCOPE and is stop 2.** The
mission corrects the published claim instead.

**Branch:** `fix/test-budget-invariant` (from `main` at or after `eeaa8ca8`)
· **Merge:** merge commit · **Agents run no git** — the orchestrator commits
each task by pathspec.

## Batches

| Batch | What | Tasks | Done |
|---|---|---|---|
| [1](batch-1/overview.md) | Fix the omission + one named constant; diagnose the catalog test | T1, T2 | [ ] |
| [2](batch-2/overview.md) | The fitness test; apply the catalog outcome | T3, T4 | [ ] |
| [3](batch-3/overview.md) | Verify, correct SI36's close-out, close out | T5 | [ ] |

Batches 1 and 2 are parallel (disjoint write-sets). Batch 3 is serial.

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
  pass: exit 0 (3 pre-existing [unplugin:dts]/TS2591/TS2503 notes are NOT a failure)
  on_fail: fix_and_rerun
- command: git diff --name-only -- src/
  pass: EMPTY. Any output is stop 1.
  on_fail: stop
- command: npx jiti scripts/render-manifest.ts --out /tmp/tbi-manifest.json && python3 plans/state-declared-size-fix/scripts/manifest-diff.py test-results/render-manifest-baseline.json /tmp/tbi-manifest.json plans/test-budget-invariant/expected-moves.txt
  pass: "0 unexpected"
  on_fail: stop
```

**Wall-clock: measure and report it; there is no ceiling.** Recent clean
readings on `main`: 58–61 s. Before **any** timing number, poll

```
ps -Aceo pcpu,comm | grep -E 'suggestd|corespotlightd|mds_stores|biomesyncd|BiomeAgent'
```

**and the 1-minute load average.** Both Spotlight and Apple's Biome daemons
confounded readings during SI36, and a settle check that polled only daemons
once started a run at load 57. Quote the load beside every number.

## What the gates do NOT prove

- `npm run lint` globs `src tests demo` only. **`scripts/` is not linted.**
- vitest `coverage.include` is `['src/**/*.ts']`. **`scripts/` is not
  coverage-measured**, so a green coverage number is not evidence about
  anything outside `src/`.

Named tests are the evidence in this mission, not the coverage figure.

## Stop conditions

1. **Any `src/` file is modified.** Test/build infrastructure only. Zero
   tolerance.
2. **A task lowers, or proposes lowering, the 120,000 ms value** (D3). The
   premise for doing so is disproven above; acting on it is the error this
   mission exists to correct.
3. **A budget is changed without a stated mechanism** — cause, `file:line`,
   causal chain, what was ruled out (`~/.claude/rules/diagnosis.md`). "Raise
   it until it passes" is the forbidden move.
4. **A global `testTimeout` is added to `vitest.config.ts`** (D4). It would
   blind ~16,000 tests to buy a fix for ~42.
5. **The fitness test detects only direct `withStdlibBuildLock` calls** and
   would miss the `:429` shape (D2). That is not-done, not a partial pass.
6. Any existing test is weakened, skipped, or deleted. Extend; never loosen.
7. A finding contradicts a locked decision (D1–D5).
8. Two consecutive gate failures on the same check.
9. Same location changed 3x consecutively without the check clearing.

## Push forward (journal the call)

Name of the constant and its helper file · the fitness test's detection
strategy (AST vs. regex) provided D2 holds · whether
`tests/unit/class/class-geo-builders.test.ts`'s single `120_000` is in scope
(verify, then decide, then journal) · probes under `scripts_scratch/T<N>/`,
deleted before commit · minor/patch dep bumps.

## Index

- [decisions.md](decisions.md) — D1…D5 (locked) ·
  [decision-journal.md](decision-journal.md) ·
  [expected-moves.txt](expected-moves.txt)
- [diagrams/budget-invariant.md](diagrams/budget-invariant.md)
- **Source record:** `plans/stdlib-lock-sharing/README.md` close-out (the
  claim this mission corrects) · its `decision-journal.md` ·
  `.agent-notes/lsh-T4.md` (max hold 20,029 ms) · `.agent-notes/lsh-T5.md` ·
  `planning/next-missions.md` item (b) · `tests/unit/stdlib-packages.test.ts:408-434`
  (the two siblings)
