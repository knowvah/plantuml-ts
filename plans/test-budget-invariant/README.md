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
| [1](batch-1/overview.md) | Fix the omission + one named constant; diagnose the catalog test | T1, T2 | [x] |
| [2](batch-2/overview.md) | The fitness test; apply the catalog outcome | T3, T4 | [x] |
| [3](batch-3/overview.md) | Verify, correct SI36's close-out, close out | T5 | [x] |

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

## Close-out (2026-08-22)

Every number below was measured this session (T5), or is cited to the task
note that measured it (T1/T2/T3/T4's `.agent-notes/tbi-*.md`) — none
restates a figure without a measurement behind it.

### The mechanism, restated plainly

`acquireBuildLock` waits up to `DEFAULT_MAX_WAIT_MS` (30,000 ms) before
throwing an error that names the lock. A test that acquires the lock (even
transitively, through a same-file helper like `npmPackDryRun`) and declares
a per-test budget shorter than that wait window dies of vitest's own
timeout first — so the lock's diagnostic error is structurally unreachable,
and every real lock failure at that site is misattributed to "test timed
out" instead. `tests/unit/stdlib-packages.test.ts:429` had exactly this
shape: no third `it()` argument, so it inherited vitest's 5,000 ms default
while transitively holding the lock. T1 fixed it and 40 other genuine
lock-pressure sites by extracting one named constant,
`LOCK_PRESSURE_BUDGET_MS` (120,000 ms, unchanged — see the corrected D3
reasoning below), to `tests/helpers/lock-pressure-budget.ts`.

### What the fitness test now prevents

`tests/architecture/stdlib-lock-test-budget.test.ts` (T3, D1/D2) fails
`npm test` if any test that acquires the **shared** stdlib build lock
(`defaultLockPath`) — directly or through same-file helper indirection, at
any depth — declares a budget that does not exceed the call's own
`maxWaitMs` override, or `DEFAULT_MAX_WAIT_MS` (parsed live out of
`build-lock.ts`, not hardcoded) if none is given. The `:429` shape (a
same-file helper masking the lock acquisition) is exactly what D2 exists to
catch, and T3 re-proved it catches it: with `LOCK_PRESSURE_BUDGET_MS`
manually removed from that call site, the detector goes red naming that
exact `file:line`; restored, it is green. Detection is scoped to the
default (shared) lock path — acquisitions that pass an explicit `lockPath`
under `mkdtempSync` are provably uncontended by construction and are a
different lock, not a weaker reading of D1 (decision-journal, T3 rows).

### Concurrent verification — 4 real pairs, 8 processes, `COVERAGE_ISOLATE=1` on both members every time

Trial runs and the final measurement run were kept separate, per the
timing-discipline boundary: trial numbers below are reported as trial
outcomes, not as the mission's wall-clock figure (that is its own
sub-section below). Every trial launched only after both `uptime` load1
and all five daemon families (`suggestd`, `corespotlightd`, `mds_stores`,
`biomesyncd`, `BiomeAgent`) were polled and had settled.

| Trial | Launch load1/5/15 | Post-run load1/5/15 | A result | B result |
|---|---|---|---|---|
| 1 | 4.53 / 10.56 / 11.34 | — | pass (630/1, 16089) | pass (630/1, 16089) |
| 2 | 9.39 / 18.24 / 15.35 | 65.31 / 35.01 / 22.20 | pass (630/1, 16089) | pass (630/1, 16089) |
| 3 | 11.84 / 24.09 / 19.66 | 70.70 / 41.92 / 27.20 | pass (630/1, 16089) | **FAIL** (629/1, 16088) |
| 4 | 11.19 / 27.59 / 23.65 | 91.27 / 52.25 / 33.85 | **FAIL** (628/1, 16087) | **FAIL** (628/1, 16087) |

**Pass rate: 2 of 4 pairs (50%) fully clean; 5 of 8 processes (62.5%)
clean.** Reported honestly — this is worse than SI36's own pre-close-out
5-trial figure (1 of 5 pairs clean), because trials 3–4 here deliberately
ran back-to-back without a full settle between them and reached
substantially higher load (post-run load1 up to 91.27, above every prior
mission's own recorded peak) than trials 1–2.

**The mission's own target defect — occurred zero times in all 8
processes.** Neither the `stdlib-packages.test.ts:428`/`:429` "Test timed
out in 5000ms" signature (T1's fix) nor
`Error: Timed out after 30000ms waiting for the stdlib build lock` (the
lock's own thrown error) appears anywhere in any of the 8 logs — verified
by `grep` across all 8, quoted:
```
$ grep -n "stdlib-packages.test.ts:42\|waiting for the stdlib build lock" t*.log
(only informational "[build-stdlib-lock] waiting for the stdlib build
lock at ..." progress lines — not the thrown timeout error — appear, in
4 of 8 logs, at the point a shared acquisition legitimately queued and
then succeeded)
```
This does not *prove* the defect can never recur — see "Limits of this
evidence" below — but across the highest load this mission measured, the
specific failure the mission exists to fix did not occur once.

**`catalog.test.ts` tripped exactly at the trial with the highest load,
and only there — the documented, accepted limit, not a regression.**
Both processes of trial 4 (post-run load1 91.27) failed with, quoted
verbatim:
```
FAIL  tests/architecture/catalog.test.ts > docs/catalog.md > is up to
  date with src/ (run `npm run catalog` if this fails)
Error: Test timed out in 5000ms.
 ❯ tests/architecture/catalog.test.ts:33:3
```
`catalog.test.ts` holds no lock (T2 confirmed: 0 references) and D5/T2's
`no-change` diagnosis named exactly this: a CPU-bound, unlocked test whose
own ~400–600 ms window only exceeds the unconfigured 5,000 ms default when
two `npm test` processes' own startup CPU bursts collide tightly — a
timing/scheduling spike, not a smooth function of load. It did not trip in
trials 1–3 (launch load1 up to 11.84) and tripped in both processes of the
one trial that reached the highest measured load. This is consistent with,
not contradicted by, T2's diagnosis.

**A third signature, previously undocumented by this mission, appeared in
3 of 8 processes — a genuine finding, not fixed here.** Quoted verbatim
(trial 3-B, trial 4-A, trial 4-B, same fixture every time):
```
FAIL  tests/oracle/svg-conformance/sequence.diff-baseline.ratchet.test.ts
  > svg-sequence diff-count baseline ratchet >
  sequence/zudize-61-vomi445: diff count never rises above its baseline (12)
Error: Test timed out in 5000ms.
 ❯ tests/oracle/svg-conformance/sequence.diff-baseline.ratchet.test.ts:226:5
```
Confirmed by reading the file: it holds no lock (`grep` for
`acquireBuildLock`/`withStdlibBuildLock` in it returns nothing) and
declares no per-test timeout, so it inherits vitest's unconfigured 5,000 ms
default across 1,141 per-fixture `it()` blocks. This is the same general
shape D5 named for `catalog.test.ts` — CPU-bound, no lock, racing the
unconfigured default under load — but at a file this mission's D1–D5 never
named, never diagnosed, and that T5 has no write-set access to fix (T5
writes no test files; this mission's write-set is docs and this note
only). **Recorded as a residual finding for a future mission**, not
patched here.

### Re-measured `npm test` wall-clock (measurement run, separate from the trials above)

Load before starting: `uptime` load1/5/15 **7.99 / 24.64 / 26.18**;
`mds_stores` 0.5%, all other four daemon families (`suggestd`,
`corespotlightd`, `biomesyncd`, `BiomeAgent`) 0.0% — the 5/15-minute
figures are elevated residue from this session's own preceding concurrent
trials, consistent with `.agent-notes/confounded-wall-clock-readings.md`'s
own warning that this machine does not fully settle between heavy runs;
the 1-minute figure and all daemons were polled and settled immediately
before launch. `npm test`: exit 0, **630 passed | 1 skipped (631 files),
16,089 passed | 2 skipped | 1 todo**, coverage
95.44%/90.47%/96.95%/96.53% (stmts/branch/func/line, all ≥ 90%), vitest
self-reported **`Duration 63.51s`**, wrapped `time` **real 1:04.54**
(64.54 s). Consistent with this branch's own Batch 1/Batch 2 readings
(60.59 s, 64.49 s) and `main`'s 58–61 s baseline — no unexplained
regression.

### Other gates, this session

`npm run typecheck` exit 0 (both tsconfigs). `npm run lint` exit 0.
`npm run build` exit 0; `grep -c "error TS"` on the build log = 0; exactly
the 3 documented pre-existing TS2591/TS2503 notes in
`src/core/include-resolver-node.ts`.

`git diff --name-only main..HEAD -- src/`, quoted verbatim:
```
(empty)
```

render-manifest vs baseline: **"OK: 0 expected moves, 0 unexpected"**
over 3,158 fixtures, re-run this session — matches
`expected-moves.txt`'s own statement that this mission changes no `src/`
and no fixture.

### The corrected claim (full text of the correction is inline at its source)

SI36's close-out (`plans/stdlib-lock-sharing/README.md`,
`### SI35's ~37 per-test 120 s timeouts — proposal, not applied here`) and
`planning/next-missions.md` item (b) both reasoned from **wait alone**
(observed worst case 12,818 ms) against the 120,000 ms ceiling and called
it "provably over-provisioned," a plausible candidate to lower. That
omits **hold time** — a lock-using test's budget must cover the full time
it can be blocked, `maxWaitMs` (30,000 ms) plus however long it can spend
actually holding the lock once acquired. This mission's own T4 predecessor
measured a max **hold** of 20,029 ms
(`.agent-notes/lsh-T4.md`, concurrent-pair "after" row, `maxHoldMs`).
Legitimate worst case is `30,000 + 20,029` ≈ 50,000 ms, so 120,000 ms is
**~2.4x** margin, not the ~9x the original claim computed from wait alone
— defensible provisioning, not slack. Both source documents are corrected
**in place**, dated and attributed to this mission, with the original
claim left visible rather than deleted (see the inline `> Correction`
block in `plans/stdlib-lock-sharing/README.md` and the rewritten item (b)
in `planning/next-missions.md`).

### Limits of this evidence

Matching the honesty standard set by `plans/stdlib-run-isolation/
README.md`'s close-out and `.agent-notes/lsh-T4.md`'s own "Limits of this
evidence" section:

- **4 concurrent pairs (8 processes) is a small sample on a shared,
  variable-load machine.** This session's own trials show load1 varying
  from 4.53 to 91.27 across roughly 15 minutes of elapsed time — an ~20x
  spread — driven by this session's own preceding trials, not an external
  actor. A larger trial count, spread over a longer wall-clock window with
  genuine settle time between every pair, would be needed to bound a
  failure *rate* with any statistical confidence. What this session shows
  is that the mission's target signature did not occur even at the
  highest load measured, not that it cannot occur at all.
- **Zero occurrences in 8 processes is consistent with the fix, not proof
  of it.** The same caveat T4 of the predecessor mission stated about its
  own 16-process result applies here at a smaller N: absence of the
  target signature across every trial is the strongest evidence this
  session can produce, but it is not a guarantee against a rarer
  collision this sample did not happen to hit.
- **The new `sequence.diff-baseline.ratchet.test.ts` finding was not
  root-caused to instrumentation-grade certainty.** It was traced to one
  specific fixture, one specific `file:line`, and confirmed to hold no
  lock and declare no per-test timeout — the same structural shape as
  D5's `catalog.test.ts` diagnosis — but T5 did not measure that
  fixture's standalone CPU-bound cost the way T2 measured
  `buildCatalog()`'s, and did not attempt to force the collision
  repeatedly the way T2 did for `catalog.test.ts`. This is a genuine open
  finding this close-out surfaces, not one it closes.
- **`catalog.test.ts`'s tripping in exactly the highest-load trial (1 of
  4) is a small-N coincidence consistent with T2's diagnosis, not an
  independent confirmation of T2's mechanism.** T2's own diagnosis
  (`.agent-notes/tbi-T2.md`) remains the load-bearing evidence for that
  test; this session's single trip adds one more data point in the
  direction T2 already predicted, nothing more.

### Correction (2026-08-23) — `catalog.test.ts` did get a budget after all

T2's `no-change` and T4's application of it are **superseded**, and the
original reasoning is left standing above rather than rewritten, on the same
terms this mission demanded of SI36's close-out.

The mission measured one 12-core dev machine and characterised a single
`npm test` as "reliable, ~12x headroom". **CI disproved that the next day**:
`tests/architecture/catalog.test.ts` failed 3 of 6 `ubuntu-latest` runs in an
ordinary single, non-concurrent `npm test` — the case T2 called reliable. The
concurrency framing was not the operative variable on that machine at all.

The number T2 correctly refused to invent has now been measured, on the
machine that actually fails, by temporarily lifting the budget so the call
could finish instead of being aborted at 5,000 ms (CI run 32611966134):
**4,419 ms in-suite**, against 389-692 ms isolated on the same runner and
392-406 ms in-suite locally. At 4,419 ms it sat at 88% of the 5,000 ms
default — grazing it on every run, which is the profile of an intermittent
failure. Budget set to 30,000 ms with the derivation recorded at the call
site and in `.agent-notes/catalog-ci-budget.md`.

**T2's reasoning was sound; its evidence base was incomplete.** Refusing to
name an unmeasured number was right, and D5 was right to permit it. The gap
was that CI was never in the sample, and CI is where the test was failing.

### Residuals, recorded honestly

- **D2's fitness test stops at same-file indirection by design.** A
  lock-using test reaching the lock through a **cross-file** helper would
  not be caught by `tests/architecture/stdlib-lock-test-budget.test.ts`.
  This is not an oversight — D2 explicitly scopes the work this way, and
  the file's own doc comment states the boundary.
- **Scanning-primitive duplication is deliberate, not an oversight.**
  `stripComments`/`findCallSpans`/`findFunctionBodySpans`-shaped logic now
  exists in both `tests/architecture/stdlib-read-lock.test.ts` and
  `tests/architecture/stdlib-lock-test-budget.test.ts`. Consolidating them
  into a shared helper is deliberate future work, out of this mission's
  scope (D1/D2 name the detection strategy, not a refactor of the sibling
  file).
- **`catalog.test.ts` has no measured worst case and no budget, by
  design.** T2's synchronized-overlap worst case was never forced to
  reproduce (`.agent-notes/tbi-T2.md`, "Not ruled out / genuine open
  boundary"); D5 explicitly permits `no-change` as an outcome rather than
  naming an unmeasured number. This session's single trip at load1 91.27
  adds a data point but still no measured worst-case wall time for the
  colliding condition specifically.
- **New: `tests/oracle/svg-conformance/sequence.diff-baseline.ratchet.
  test.ts:226` (fixture `sequence/zudize-61-vomi445`) is a previously
  undocumented instance of the same class of risk D5 named for
  `catalog.test.ts`** — CPU-bound, no lock, racing vitest's unconfigured
  5,000 ms default under concurrent load. Observed in 3 of 8 processes
  this session, always the same fixture. Out of this mission's write-set
  (T5 writes no test files) and outside D1–D5's scope (D1 binds only
  lock-acquiring tests). Flagged here as a follow-on candidate for a
  future mission — not investigated or fixed.
- **T3's 14-site scoping adjudication (decision-journal, T3 rows)
  narrowed the detector to the default (shared) lock path** —
  acquisitions that pass an explicit scratch `lockPath` under
  `mkdtempSync` are excluded because they are provably uncontended and
  exercise the lock mechanism itself, not the shared production lock.
  This is a scope boundary on what counts as "the stdlib build lock" for
  D1's purposes, carried forward here rather than re-litigated.

### What this mission did NOT do

No `src/` file was modified at any batch (`git diff --name-only
main..HEAD -- src/` empty, quoted above, re-verified this session). The
120,000 ms `LOCK_PRESSURE_BUDGET_MS` value was never lowered and no task
proposed lowering it (D3, stop condition 2 — honored throughout). No
global `testTimeout` was added to `vitest.config.ts` (D4). No existing
test was weakened, skipped, or deleted (stop condition 6).
