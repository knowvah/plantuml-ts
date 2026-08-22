# Mission: stdlib-lock-sharing

**Give the stdlib build lock a shared (reader) mode, so concurrent test runs
stop serialising against peers they never needed to exclude.**

`stdlib-run-isolation` (SI35, merged `72fbdc4f`) put 8 reader test files under
the cross-process build lock. It closed the `generated/` race and was the
right call. But readers acquire the lock in the **same exclusive mode a
builder does**, and a reader has no conflict with another reader — only with a
builder. The result is measured, not theorised:

| | Single run | Two concurrent suites |
|---|---|---|
| Acquisitions | 288 | 573 |
| Total **holding** | 12.4 s | 35.9 s |
| Total **waiting** | **54.7 s** | **229.6 s** |
| Max wait | 9.5 s | **29,724 ms** |
| `maxWaitMs` timeouts | 0 | 3 |

**229.6 s of waiting to protect 35.9 s of holding** — a 6.4:1 waste ratio,
almost entirely reader-versus-reader. And max wait of 29,724 ms against a
30,000 ms budget: the suite grazes the cliff on every concurrent run, which is
why failures are intermittent (1–2 of 6) rather than deterministic.

Note also **288 acquisitions in a single run**, not the 8 the conversion
implies — the wrapped calls sit inside parametrized cases.

Full diagnosis: `.agent-notes/stdlib-lock-budget.md`.

**Branch:** `fix/stdlib-lock-sharing` (from `main` at or after `dceb028c`)
· **Merge:** merge commit · **Agents run no git** — the orchestrator commits
each task by pathspec.

## Raising `maxWaitMs` is NOT the fix, and is out of scope

It moves the cliff without removing it. Doubling the suites roughly
quadrupled total wait (54.7 s → 229.6 s), so a larger budget buys one more
concurrent run while doubling how long a genuine deadlock takes to surface.
A task that proposes it has misread the measurement — see stop 6.

## The design (locked, D1–D4)

Readers acquire **shared** and may hold concurrently. The builder acquires
**exclusive**, draining readers and blocking new ones. This preserves exactly
the safety property SI35 bought — a reader is never mid-read while a builder
`rmSync`s the tree — while deleting the reader-versus-reader serialisation.

## Batches

| Batch | What | Tasks | Done |
|---|---|---|---|
| [0](batch-0/overview.md) | Reusable contention harness + baseline | T0 | [x] |
| [1](batch-1/overview.md) | Shared mode in the lock (TDD) | T1 | [ ] |
| [2](batch-2/overview.md) | Wire readers and the builder | T2, T3 | [ ] |
| [3](batch-3/overview.md) | Re-measure, verify, close out | T4, T5 | [ ] |

Batch 2 is parallel (disjoint write-sets). Everything else is serial. T0
comes first deliberately: without a reusable harness T4 cannot prove the fix
beat the baseline, and "it feels faster" is not evidence.

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
  pass: EMPTY. Any output is stop 1.
  on_fail: stop
- command: git diff --stat main..HEAD -- packages/
  pass: EMPTY. Any output is stop 5.
  on_fail: stop
- command: npx jiti scripts/render-manifest.ts --out /tmp/lsh-manifest.json && python3 plans/state-declared-size-fix/scripts/manifest-diff.py test-results/render-manifest-baseline.json /tmp/lsh-manifest.json plans/stdlib-lock-sharing/expected-moves.txt
  pass: "0 unexpected"
  on_fail: stop
```

**Wall-clock: measure and report it; there is no ceiling.** Report `npm test`
duration with the machine load (`uptime` plus
`ps -Aceo pcpu,comm | grep -E 'suggestd|corespotlightd|mds_stores'`), and
**wait for `corespotlightd` to fall to ~0 before timing** — self-induced
Spotlight reindexing has burned readings across three consecutive missions.

Baseline for reference: `main` post-merge measured **60.32 s** (628 files /
16,050 tests). SI35 raised ~37 per-test timeouts to 120 s under lock
pressure; if this mission's change makes those unnecessary, say so — but do
**not** lower them speculatively.

## Stop conditions

1. **Any `src/` file is modified.** This is test/build infrastructure. Zero
   tolerance.
2. **The new lock can block unboundedly** — any path not bounded by
   `maxWaitMs`. A deadlock is strictly worse than the timeout being fixed.
3. **Any existing exclusive-mode lock test is weakened, skipped, or deleted**
   to accommodate shared mode. Extend; never loosen.
4. Two consecutive gate failures on the same check.
5. A change to what any `@knowvah/plantuml-stdlib*` package publishes
   (`main`, `types`, `exports`, `files`).
6. **A task proposes raising `maxWaitMs`, or tuning any constant, to make a
   number look better.** Fitting is forbidden here exactly as it is for
   rendering constants. If the redesign does not beat the baseline, that is a
   finding to report — stop 8.
7. A finding contradicts a locked decision (D1–D4).
8. **Measured waiting does not materially drop** after T1–T3 land. Stop and
   report rather than tuning toward the target.
9. Same location changed 3x consecutively without the check clearing.

## Push forward (journal the call)

Harness shape and filenames · probes under `scripts_scratch/T<N>/`, deleted
before commit · naming of the readers directory and the writer-intent marker
· poll-interval tuning *for correctness, never to flatter a measurement* ·
minor/patch dep bumps.

## Index

- [decisions.md](decisions.md) — D1…D4 (locked) ·
  [decision-journal.md](decision-journal.md) ·
  [expected-moves.txt](expected-moves.txt)
- [diagrams/lock-modes.md](diagrams/lock-modes.md)
- **Source record:** `.agent-notes/stdlib-lock-budget.md` (the measurement) ·
  `.agent-notes/coverage-tmp-race.md` (the sibling defect, already fixed) ·
  `planning/adr/ADR-003-stdlib-run-isolation.md` (why readers hold the lock
  at all) · `plans/stdlib-run-isolation/README.md` close-out
