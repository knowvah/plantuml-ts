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
| [2](batch-2/overview.md) | Up-to-date skip · globalSetup doc (PARALLEL) | T2, T3 | [x] |
| [3](batch-3/overview.md) | Cross-process lock with stale recovery | T4 | [x] |
| [4](batch-4/overview.md) | Verify, document the residual hole, close out | T5 | [x] |

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

## Close-out (2026-08-21)

**Every number below was re-measured this session** — nothing here restates
a task-report or journal figure without independently re-running it.

**Mechanism, proven at T0.** `freshGeneratedDir`
(`scripts/build-stdlib-packages.ts:42-47`) unconditionally
`rmSync(generatedDir, { recursive: true, force: true })`s a fixed,
repo-absolute, gitignored path (`packages/<pkg>/generated/`) with no
cross-process coordination. Two concurrently-running `vitest` processes
each call it from their own `globalSetup`; if process B's `rmSync`+rewrite
window overlaps process A's worker `import()`ing out of that same path, A's
worker sees the tree emptied or mid-rewrite and fails with
`Cannot find module .../tupadr3.remote.js`. `globalSetup`'s own
"no test ever observes a half-rebuilt tree" guarantee (D5) is true only
*within* one vitest process — it says nothing about a second, independent
one racing the same fixed path.

**The guarded repro — corrected framing.** `STDLIB_BUILD_RACE_REPRO=1 npx
vitest run tests/integration/stdlib-build-race.test.ts`, run 5 times this
session on the fixed tree, all green:

| Run | Result | Duration |
|---|---|---|
| 1 | 1 passed | 127.49s |
| 2 | 1 passed | 123.38s |
| 3 | 1 passed | 124.61s |
| 4 | 1 passed | 124.64s |
| 5 | 1 passed | 126.41s |

This is **not** evidence the lock works. The repro's writer loops
`buildStdlibPackages()` against unchanged inputs, so from the second
iteration onward T2's content-hash skip alone makes every call a no-op
(`isGeneratedDirUpToDate`/`isSpriteSplitUpToDate` both report true — see
the `skip --` log lines in every run above). The repro went GREEN after T2
landed the skip, **before any lock existed** (recorded in the decision
journal, 2026-08-21, "T4's acceptance clause ... is ALREADY SATISFIED
before T4 begins"). 5/5 here confirms the skip still holds on the
committed tree; it says nothing about concurrent builds of genuinely
different inputs, which is the case the lock exists for.

**The lock's real evidence** (measured by the orchestrator during T4,
cited here rather than re-derived, since re-running it adds no new
information beyond confirming the mechanism a second time):
three concurrent real builders raced a cold tree — one acquired the lock
and rebuilt all 5 targets; the other two waited, re-checked the up-to-date
predicate *inside* the lock, and skipped all 5 with zero `rmSync` calls.
All three exited 0, no lock file was left behind, and the tree was valid
afterward (4 generated files, 2078 sprites) — exactly D3's predicted
sequence: build under the lock, release, second/third holder re-checks and
skips instead of deleting under a live reader. Stale-lock recovery was
proven separately: a lock naming a dead PID reclaimed in 421ms, and a
corrupt/truncated lock (the exact `{"pid":12345,"acqui` shape a crash or
full disk mid-write would leave) reclaimed after its 2s grace period in
2473ms — before the fix, that same corrupt input stalled 30s then threw,
and every subsequent run repeated the stall forever until a human deleted
the file by hand.

**What the fix consists of, and what each half cannot do alone (D3).**
Two parts, both required:

1. **Content-derived up-to-date skip** (T2, `isGeneratedDirUpToDate` /
   `isSpriteSplitUpToDate`) — hashes build inputs and the emitted
   manifest, never a file count or mtime (D4). Alone, this is
   insufficient: a second process can observe a *partial* tree mid-write
   by the first, judge it stale by content, and `rmSync` it anyway —
   the skip has no way to know a build is currently in flight.
2. **Cross-process lock** (T4, `scripts/build-stdlib-packages/build-lock.ts`)
   — serializes `buildStdlibPackages()` across processes via an atomic
   `wx`-flag lock file, with dead-PID and corrupt-content stale recovery,
   bounded wait (throws rather than spinning forever). Alone, this is
   also insufficient: the lock is released once a build finishes, before
   that same process's *workers* import — so a second process can legally
   acquire the (now free) lock and still `rmSync` the tree out from under
   the first process's in-flight readers.

   Together: the second lock holder's up-to-date re-check happens
   *inside* the lock, against a tree the first holder finished building
   before releasing — so for the common case (two runs building
   byte-identical output) the second holder always sees a complete tree
   and skips instead of deleting.

**Re-measured `npm test` wall-clock.** Settled machine: `uptime` load
averages **4.64 7.32 8.29** immediately before the run, `corespotlightd`
and `suggestd` both **0.0%** (a Spotlight reindex triggered by the 5 repro
runs' file churn had spiked `corespotlightd` to 175.8% minutes earlier;
polled every 5s until it cleared before measuring). Result: **exit 0**,
626 test files passed / 1 skipped (627), 16034 tests passed / 2 skipped /
1 todo, coverage 95.44% statements / 90.47% branches / 96.95% functions /
96.53% lines. Vitest `Duration` **57.72s**, wrapped `real` **58.72s** —
under the **60.3s** ceiling with ~1.6s headroom on the wrapped figure,
consistent with the 55.75–57.00s range measured across batches 1–3.

**`src/` untouched, re-confirmed this session:**
```
$ git diff --name-only main..HEAD -- src/
(empty)
```
`git status --short` also empty; no stray `stdlib-build-race`/lock-related
process (`ps aux` scan) and no stray lock file under `/var/folders` after
the full repro x5 + `npm test` + typecheck + lint + build.

**The residual hole (D3), documented as prominently as the fix — CLOSED by
a follow-on mission, `stdlib-run-isolation` (2026-08-21).** See the
correction and outcome below; the paragraphs that follow are preserved
exactly as this mission wrote them, because they record the reasoning that
motivated re-opening the question, not because they are still the final
word on the residual's status.

If a second run's source genuinely changes mid-run (not the
unchanged-inputs case this mission's repro exercises), that second run
still rebuilds — and therefore still `rmSync`s — once it acquires the
lock, while the first run's workers may still be importing from the tree
it just deleted. The two runs are, in that case, testing different source
against one shared mutable path, and the lock's serialization does not by
itself make that safe: it only guarantees the *rmSync + rewrite* is
atomic with respect to *other builders*, not with respect to *the first
run's own readers*, which never coordinate with a build that started
after they began reading.

**Why this was accepted rather than closed, at the time.** The mechanism
that *would* close it — a per-run isolated output directory — was
**explicitly declined by the user on 2026-08-21** (`decisions.md` D3). The
blast radius was judged too large: `tests/integration/stdlib-remote-e2e.test.ts:49,51`
import fixed absolute paths, and each stdlib package's own
`package.json`/`prepack` step references `generated/` directly, so
isolating it would touch packaging surface for every consumer of these
packages, not just the test harness.

> **Correction (`stdlib-run-isolation`, 2026-08-21).** This refusal was
> judged against an under-count. The two fixed-path imports named above are
> not "two import sites" in the sense the refusal implied — an independent
> census (`stdlib-run-isolation` T1, cross-checked twice more in that
> mission's T2 and T5) found **21 total consumers** of
> `packages/<pkg>/generated/` and **8 concurrent readers** running inside
> default vitest workers. The follow-on mission also established that
> relocating the canonical tree was never actually available as an option
> regardless of the count: `npm pack --dry-run` resolves against the real
> package directory and cannot be redirected, so the tree could only ever
> be *supplemented*, never moved — meaning no option on the table, at any
> known import-site count, was ever going to touch `main`/`types`/`exports`/
> `files`. See `plans/stdlib-run-isolation/README.md#close-out-2026-08-21`
> for the full re-measurement, the options ADR, and the option the user
> chose (extending the build lock to cover readers).

**What symptom this residual would produce, so the next person recognizes
it instead of re-opening the investigation:** the *same* signature as the
original bug — `Cannot find module .../packages/<pkg>/generated/<file>.js`
in a worker mid-import, or a spurious/mismatched module body if the
import resolves mid-rewrite instead of failing outright — but now
triggered only when two concurrent full-suite runs genuinely straddle a
source change to `assets/stdlib/` (or the package specs) between them,
not on every concurrent run. It should now be **far rarer** than the
original 1-in-7 (it requires both concurrency *and* a source change
landing in the same window) but is not structurally impossible.

> **Status: CLOSED, not merely accepted (`stdlib-run-isolation`,
> 2026-08-21).** The user approved extending the cross-process build lock
> to cover all 8 in-worker readers (including the 2 `npm pack` tests, which
> the originally-considered isolated-directory approach could never have
> reached). `stdlib-run-isolation` T5 re-ran this mission's own reproduction
> harness against the fix (`FAIL at attempt 2897` unlocked vs. 500/500
> clean with the lock held, 17 measured lock waits) and ran two real,
> concurrent full `npm test` invocations straddling one genuine rebuild of
> `stdlib-tupadr3`'s tree end to end, with no `generated/`-tree failure in
> either. Full detail, including the honest limits of that end-to-end
> result, in `plans/stdlib-run-isolation/README.md#close-out-2026-08-21`.

**Two smaller residuals carried forward from T2's note, not fixed here
(same reasoning — closing them risks reintroducing a D4-style count-based
staleness check):**
1. A file placed in `generated/` that was never tied to any spec entry at
   all survives indefinitely across repeated skips, since
   `isGeneratedDirUpToDate` only compares the outputs it knows to expect
   (`freshOutputs`), never a directory listing. Narrower than it sounds —
   it requires a file entering that gitignored, tool-owned directory
   through some means other than this generator or a legitimate spec
   edit.
2. `isGeneratedDirUpToDate` correctly detects a legitimate spec change
   (removed/renamed module) because `index.js`'s emitted re-export lines
   change and its hash then mismatches — that case *is* closed. Only the
   narrower case in (1), a file with no corresponding spec entry at all,
   is not.

**What this mission did NOT do.** No `src/` file was touched at any
batch — confirmed by an empty `git diff` on every gate run including this
one. No product behavior changed and no rendering was affected: the
render-manifest gate reported **"0 unexpected"** at every batch (T0
through T4). This mission's entire footprint is test/build
infrastructure: `scripts/build-stdlib-packages.ts`,
`scripts/build-stdlib-packages/build-lock.ts`,
`tests/helpers/build-stdlib-globalsetup.ts`,
`tests/helpers/stdlib-build-race-{writer,reader}.ts`,
`tests/integration/stdlib-build-race.test.ts`, and their associated unit
tests.

**Four gates, this session:**

| Gate | Result |
|---|---|
| `npm test` | exit 0, 626/627 files, 16034/16037 tests, coverage 95.44/90.47/96.95/96.53, Duration 57.72s / real 58.72s (ceiling 60.3s), load1 4.64 at start |
| `npm run typecheck` | exit 0 (both tsconfigs) |
| `npm run lint` | exit 0 |
| `npm run build` | exit 0 — exactly the 3 pre-existing TS2591/TS2503 notes in `src/core/include-resolver-node.ts`, not a new failure |
