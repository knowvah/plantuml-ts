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
| [1](batch-1/overview.md) | Shared mode in the lock (TDD) | T1 | [x] |
| [2](batch-2/overview.md) | Wire readers and the builder | T2, T3 | [x] |
| [3](batch-3/overview.md) | Re-measure, verify, close out | T4, T5 | [x] |

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

## Close-out (2026-08-22)

Every number below is either re-measured this session (the `npm test`
wall-clock, the scope/manifest gates) or cited to the task note that
measured it (T0's baseline, T4's contract table and 5 trials, the
orchestrator's controlled-load experiment) — none restates a figure without
a measurement behind it. Full detail: `decision-journal.md` (all rows),
`.agent-notes/lsh-T0.md`, `.agent-notes/lsh-T4.md`, `.agent-notes/lsh-T5.md`.

### Contention: before (T0) vs after (T1–T3), reader-vs-reader collapsed

| | Single run — before | Single run — after | Concurrent-pair — before | Concurrent-pair — after |
|---|---|---|---|---|
| Acquisitions | 288 | 300 | 576 | 600 |
| Total **waiting** | 33,806 ms | **1,018 ms** | 319,190 ms | **3,769 ms** (headline trial) |
| Total **holding** | 12,903 ms | 21,211 ms | 40,261 ms | 60,890 ms |
| Max wait | 7,434 ms | 205 ms | 29,500 ms | 950 ms (headline trial) |
| `timeouts` (waitMs ≥ 30,000) | 0 | 0 | 0 | 0 |

**The concurrent-pair "after" column is one trial, not the typical case —
T4 published its single best measurement.** Five independent
concurrent-pair trials (10 `npm test` processes) range **totalWaitMs
3,737–49,804 ms** and **maxWaitMs 785–12,818 ms**, a ~13x spread on this
session's shared, variable-load machine:

```
trial1 totalWaitMs=49,804  maxWaitMs=12,818
trial2 totalWaitMs= 6,622  maxWaitMs= 1,450
trial3 totalWaitMs=22,913  maxWaitMs= 8,698
trial4 totalWaitMs= 3,737  maxWaitMs=   785
trial5 totalWaitMs=24,664  maxWaitMs= 8,665
```

Even the worst trial (49,804 ms) is **84.4% below** the 319,190 ms
pre-fix baseline; the median trial (22,913 ms) is **92.8% below**.
`timeouts: 0` in all five — no trial's `waitMs` reached the 30,000 ms
production budget, though trial1's 12,818 ms max wait shows the fix does
not make the cliff structurally impossible, only far less likely to be
reached. Acquisitions rose modestly (+12/process, 288→300 / 576→600) — T1
added direct `acquireBuildLock` calls to unit-test the new shared path, not
a change in production call volume. Holding rose (readers now overlap
instead of queue, so more holders are mid-hold at any instant) — expected,
not a regression.

### Concurrent trial pass rate — two failure modes, only one is this
mission's target

Across T4's 5 trials (10 processes) plus the orchestrator's 3
controlled-load pairs (6 processes) — **16 post-fix processes total**:

- **The mission's target defect —**
  `Error: Timed out after 30000ms waiting for the stdlib build lock` **—
  occurred zero times in all 16.** Pre-mission reference: 2 of 6
  shared-coverage and 1 of 6 isolated runs failed with that exact
  signature. This is the decisive result: the defect this mission exists
  to fix is closed under every condition measured, including the highest
  load tested (below).
- **A second, unrelated failure mode showed up in 4 of T4's 5 trials**
  (1 of 5 pairs, 20%, fully clean — 5 of 10 processes, 50%, failed):
  vitest's **default 5,000 ms per-test timeout** (`vitest.config.ts` sets
  no `testTimeout`) on two pre-existing, CPU-bound tests this mission's
  write-set never touched — `tests/architecture/catalog.test.ts:20`
  (`buildCatalog()` walks `src/` synchronously) and
  `tests/unit/stdlib-packages.test.ts:429` (`npm pack --dry-run` subprocess
  spawn). Neither test's log ever names the lock; `acquireBuildLock` never
  throws in any of the 5 trials.

  **The orchestrator separated load from the redesign with a controlled
  experiment**, 3 concurrent-pairs at named starting 1-minute load
  averages: load **4.37 → 2/2 pass, 0 timeouts**; load
  **28.15 → 2/2 pass, 0 timeouts**; load **57.07 → 0/2 pass, 2×
  `Error: Test timed out in 5000ms`** (same two tests, same signature).
  **The 5,000 ms failures track machine load, not the redesign** — T4's
  own trials ran at `uptime` load 15–64, which explains its 4/5 figure.
  This is a genuine, real behavior change worth naming honestly: removing
  `Atomics.wait` queueing means two suites' CPU-bound work now runs
  genuinely concurrently instead of one queued behind the other's sleep,
  which plausibly makes a tight, unconfigured 5 s budget bite harder under
  load than it did when contention meant sleeping, not competing. There is
  no pre-fix data point at load ~57 to compare against, so this is **shown
  not to bite at normal load, not disproven** at pathological load.

### SI35's ~37 per-test 120 s timeouts — proposal, not applied here

SI35 raised ~37 per-test timeouts to 120 s (six times vitest's 5 s
default) because the *old* exclusive-mode lock could make a single
acquisition wait up to the 30,000 ms production budget. Post-fix, the
worst single acquisition observed across every measurement this
mission took — T0's pre-fix 29,500 ms max wait vs. T4's headline 950 ms
and the 5-trial range 785–12,818 ms — tops out at **12,818 ms**, roughly
**9x smaller** than the 120 s ceiling SI35 set. **The 120 s figure looks
safely over-provisioned and is a plausible candidate to lower** — but not
to vitest's bare 5 s default: 3 of the 5 trials above (12,818 / 8,698 /
8,665 ms) exceeded 5,000 ms on lock wait alone, so removing the override
entirely would reintroduce lock-caused flakes at exactly the signature
this mission fixed. **This is a follow-on proposal, per the boundary
above — not applied in this task.** A future mission should re-measure at
a larger trial count before picking a specific lowered value.

### Re-measured `npm test` wall-clock, this session

Load before measuring: `uptime` 13:04, load averages **7.33 25.33 31.42**
(1/5/15-min); `ps -Aceo pcpu,comm | grep -E
'suggestd|corespotlightd|mds_stores|biomesyncd|BiomeAgent'` — all ≤ 0.5%
(`mds_stores` 0.5%, everything else 0.0%), so background indexing was not
a confound. Two consecutive clean runs: `time npm test` wall **59.995 s**;
immediately after, vitest's own **`Duration 58.51s`**. Both exit 0, 629
passed | 1 skipped test files, 16,076 passed | 2 skipped | 1 todo tests,
coverage 95.44/90.47/96.95/96.53 (stmts/branch/func/line, all ≥ 90%).
Consistent with this branch's own earlier readings (B0 61 s, B1 60 s) —
this mission's redesign carries no measurable wall-clock cost on a single,
uncontended run; the entire benefit and the entire new risk are in the
*concurrent* case, above.

### Other gates, this session

`npm run typecheck` exit 0 (both tsconfigs). `npm run lint` exit 0.
`npm run build` exit 0, exactly the 3 pre-existing TS2591/TS2503 notes in
`src/core/include-resolver-node.ts`.
`git diff --name-only main..HEAD -- src/`: **empty** (quoted, re-run this
session). `git diff --stat main..HEAD -- packages/`: **empty**.
render-manifest vs baseline: **"0 expected moves, 0 unexpected"** over
3,158 fixtures, re-run this session — confirmed clean at B0, B1, and here;
B2's own journal row records gates green but does not re-quote the
manifest figure inline, so the unbroken chain (clean at B1 → clean here,
with B2's `expected-moves.txt` unchanged in between) makes an undetected
regression there unlikely but not independently re-verified for that one
batch specifically.

### What this mission did NOT do

No `src/` file was modified at any batch (`git diff --name-only
main..HEAD -- src/` empty, quoted above). No product behavior changed and
no rendering was affected — render-manifest reported "0 unexpected" at
every batch this session directly confirmed. Nothing any of the four
`@knowvah/plantuml-stdlib*` packages publish (`main`, `types`, `exports`,
`files`) changed at any point (`git diff --stat main..HEAD -- packages/`
empty, quoted above).

### Costs and residuals, recorded honestly

- **Reader-entry inode churn (D1's own stated cost, not new information,
  restated here as a residual).** Each shared acquisition creates
  `<lockPath>.readers/<pid>-<seq>` and removes it on release — the same
  create/delete-per-acquisition shape the old exclusive lock always had,
  but with one difference that matters: the old lock never had more than
  one *live* lock file at a time (only one holder, ever); shared mode now
  keeps one live file **per concurrently-held reader section**, so a burst
  of overlapping readers means a burst of simultaneously-live files in
  `.readers/` where before there was structurally at most one. Not
  measured as a problem this mission — no test approached a reader count
  where directory-listing cost (`readdirSync` inside `countLivePresence`,
  called on every `drainPresence` poll) would matter — but it is a real,
  new shape of cost that scales with concurrent reader count, not with
  acquisition count.
- **Reader-entry leakage on a crashed reader — bounded, not unobserved
  because untested, but not a mission-generated crash test either.**
  `isEntryStale` reclaims a dead-PID entry immediately (`isProcessAlive`
  check) and an unparseable or aged entry after `staleAgeMs` (60,000 ms
  default) — the identical discipline `build-lock.ts` already uses for the
  writer lock, and `tests/unit/build-stdlib-lock.test.ts:756` unit-tests
  a live reader outlasting `maxWaitMs` while a writer drains. What is
  **not** tested anywhere in this mission: a reader process that crashes
  mid-hold on a still-live PID reused by an unrelated process before the
  60 s stale window — a stranger-reclaim race the code's own comments
  flag (`reader-registry.ts:95`, "reclaimed by a stranger") but which no
  test in this mission's write-set exercises for the *reader* side
  specifically (only the analogous writer-lock scenario is proven).
- **Writer starvation under pathological reader arrival rates — reasoned
  about, not load-tested.** D3's writer-intent marker is unit-tested for
  the single case that matters mechanically (`build-stdlib-lock.test.ts:
  685`, one reader queues behind a published marker) and the wait is
  provably bounded by the same `deadline` computed once at
  `acquireWriterFile`'s start (verified by the orchestrator at T1, journal
  row). What was never exercised: a *continuous* stream of overlapping
  readers arriving faster than the existing readers drain, which is
  exactly the shape 573–600 acquisitions per concurrent-pair run
  demonstrates is realistic. The design bounds any single writer wait to
  `maxWaitMs`; it does not bound how close to that ceiling a pathological
  arrival pattern could push it, and this mission did not attempt to
  construct one.
- **CPU-competition under high load — the mission's most important named
  caveat, carried forward unsoftened.** The redesign removes
  `Atomics.wait` queueing between readers, so two suites now genuinely
  compete for CPU where one previously slept. This plausibly explains
  the 5,000 ms per-test timeout failures at load 57.07 in the controlled
  experiment above. There is no pre-fix data point at comparable load to
  compare against — **this is shown not to bite at normal load, not
  disproven** at pathological load. Any future regression report of
  flaky CPU-bound tests under heavy concurrent load should check this
  mechanism before assuming it is unrelated.
- **Coverage does not evidence this mission's code.** `vitest.config.ts`'s
  `coverage.include` is `['src/**/*.ts']` and `npm run lint` globs
  `src tests demo` — `scripts/` (where the entire lock redesign lives) is
  covered by neither gate. The real evidence is the named test counts:
  `tests/unit/build-stdlib-lock.test.ts` 10 → 21 `it()` blocks,
  `tests/unit/with-stdlib-build-lock.test.ts` 6 → 8 (both re-counted this
  session).
