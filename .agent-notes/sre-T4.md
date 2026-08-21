# SRE T4 — stdlib-build-race, cross-process build lock

## Scope
Completes D3: T2 landed the content-derived up-to-date skip; this task adds
the cross-process lock so a second run's up-to-date re-check always sees a
COMPLETE tree, never a partial one.

## What changed
New: `scripts/build-stdlib-packages/build-lock.ts` (exports `acquireBuildLock`).
Edited: `scripts/build-stdlib-packages.ts` — `buildStdlibPackages()` now
acquires the lock BEFORE the `for (spec of PACKAGE_SPECS)` loop / `buildAllPackage()`
/ `buildSpriteSplits()` and releases it in a `finally`, so every `rmSync` any
of those three call happens inside the critical section. No `src/` change
(confirmed: `git diff --name-only -- src/` empty).

## On-disk representation
One file, `{pid, acquiredAt}` JSON, created with `writeFileSync(path, ..., {flag:'wx'})`
(`O_CREAT|O_EXCL` — atomic create-if-absent on every platform Node supports).
Default path: `join(tmpdir(), 'plantuml-ts-stdlib-build-<sha256(repoRoot).slice(0,16)>.lock')`
— deterministic per repo, needs no `.gitignore` entry, every process building
the SAME repo computes the same path independently.

## Stale recovery vs. D4 — explicitly not the same question
A lock is reclaimed if its `pid` is dead (`process.kill(pid,0)` throws
something other than `EPERM`) OR its age exceeds `staleAgeMs` (default 60s).
**This is not a D4 violation.** D4 governs whether build OUTPUT is
up-to-date (must be content-hash, never count/mtime). The age/liveness
check here is about whether the LOCK HOLDER is still alive — a different
question about a different thing. Documented explicitly in the module's own
top-of-file comment so a later reader doesn't conflate the two.

## Bounded wait
`acquireBuildLock` polls (`tryCreateLockFile` → `reclaimIfStale` → deadline
check → sleep) via `Atomics.wait`-based synchronous sleep — required
because `buildStdlibPackages()` is called with no `await` from
`globalSetup`. Throws `Timed out after <maxWaitMs>ms waiting for the
stdlib build lock at <lockPath>` once `maxWaitMs` (default 30s) elapses
against a live, non-stale holder. Never spins unboundedly.

## Tests — `tests/unit/build-stdlib-lock.test.ts` (6 tests, all isolated
`mkdtempSync` fixtures, never the real `packages/*/generated/` tree)

1. **On-disk representation**: lock file appears at the deterministic
   default path while held, disappears on release (`readdirSync(tmpdir())`
   scan by prefix/suffix — not a log line).
2. **Uncontended cost**: 200 acquire+release cycles, measured **~0.06ms/cycle**
   (assertion bound: <20ms, generous). See "Uncontended cost" below for the
   raw number.
3. **Bounded wait / timeout**: deterministic (injected fake `now`/`sleep`,
   zero real wall-clock time), a lock held by a simulated always-alive
   holder past `maxWaitMs=100` throws with the lock path and `100ms` both
   in the message.
4. **Stale recovery, real dead process**: spawns `node -e "process.exit(0)"`,
   awaits its real exit, writes a lock file naming that now-dead pid, calls
   `acquireBuildLock` with the REAL default `isProcessAlive` — reclaims and
   acquires in **well under 1000ms** (bound asserted), logs both
   `reclaiming stale lock` and the dead pid; does not hang.
5. **Composed with T2's real predicate (the actual D3 acceptance clause)**:
   two real OS processes. A "holder" child (spawned via local `jiti`)
   acquires the lock, signals a ready sentinel, holds for 200ms via a real
   `Atomics.wait` sleep, releases. The test waits for that sentinel, then
   calls the REAL `acquireBuildLock` — genuinely blocks (measured wait
   `>= 100ms`, i.e. `>= 0.5 * holdMs`) — then, once acquired, calls the
   REAL `isGeneratedDirUpToDate` (imported from `build-stdlib-packages.js`,
   not reimplemented) against a pre-populated build dir. Asserts `true`,
   performs NO `rmSync`, and proves it via `statSync(...).ino` equality
   (inode survives) plus unchanged content — filesystem evidence, not a log
   line.
6. **3 concurrent builders**: three real child processes race
   `acquireBuildLock` + a synthetic build-or-skip worker (mirrors
   `writeOutputs`'s shape: read expected content, skip if it already
   matches, else `rmSync`+recreate+write+increment a build-count file, all
   inside the lock). All three exit 0; exactly 1 logs `BUILD`, 2 log
   `SKIP`; final `output.txt` byte-equals what a single-builder run would
   produce; `build-count.txt` is exactly `1`; no lock file left behind.

## Uncontended cost (measured claim, not assumed)
`console.log` from test 2: **~0.06ms/cycle** for 200 acquire+release cycles
against an isolated lockPath (single `wx` write + single `rmSync`, no
contention, no sleep ever invoked). Negligible relative to the ~56s suite
duration and to `buildStdlibPackages()`'s own multi-file rewrite cost.
`globalSetup` calls `buildStdlibPackages()` exactly once per vitest
process, so in the real suite this is one acquire+release, not a loop.

## Regression check — T1's guarded repro (NOT proof of the lock)
`STDLIB_BUILD_RACE_REPRO=1 npx vitest run tests/integration/stdlib-build-race.test.ts`:
**1 passed** (Duration 127.01s). This is the SAME result T2 already
produced (T2's note: "still FAILS" before T2's own fix within the same
run... then separately documents the repro PASSING post-T2's up-to-date
skip). Per the task brief: this harness only exercises the
unchanged-inputs case, which T2's skip alone already closes — it would
have passed with no lock at all. Quoted here only as a regression check
(nothing broke), not as evidence the lock works. The lock's actual
evidence is tests 4–6 above (dead-process recovery, real wait+skip
composition, 3-concurrent-builders).

## D3's residual (accepted, not touched here)
If a second run's inputs genuinely changed mid-run, it still rebuilds
(and `rmSync`s) once it holds the lock — the two runs are testing
different source, which is the case the user explicitly declined to
close via a per-run isolated output directory. Not attempted here, per
the locked decision.

## Complexity hook
`resolveOptions`'s original single object literal with 9 `??` expressions
tripped the hook (CCN 19). Refactored into `productionDefaults` (a plain
object literal, no branching) + `applyOverrides` (one `for`/`if`, CCN 2) +
a 1-line `resolveOptions` — no exemption widened, no complexity-ignore
entry added. `scripts/build-stdlib-packages.ts` grew from 291 to 310
lines (limit 500). No new file was needed there; `build-lock.ts` is a
NEW file (217 lines), inside the pre-approved
`scripts/build-stdlib-packages/` extraction path — named here per the
task's instruction to report if this happened.

## Quality gates (measured on a settled machine)
- Machine settling: my own test runs (repeated `mkdtempSync` writes across
  6 tests, including a 200-iteration loop and 2 multi-process tests)
  triggered the documented Spotlight-reindex confound — `corespotlightd`
  spiked to 288% and load1 to 40.75 immediately after. Waited (polled
  `uptime` every 15s) until `corespotlightd`/`mds_stores`/`suggestd` all
  read 0% before taking the numbers below.
- `npm test`: 626 test files passed / 1 skipped (627); 16032 passed / 2
  skipped / 1 todo (16035). **Duration 56.24s.** `uptime` load1 **4.41**
  just before the run (`mds_stores`/`suggestd`/`corespotlightd` all 0%) —
  under the 60.3s ceiling, in line with the 55.75-57.20s baseline range.
- `npm run typecheck`: exit 0, no output (both tsconfigs).
- `npm run lint`: exit 0, no output.
- `npm run build`: exit 0. Exactly the 3 pre-existing TS2591/TS2503 notes
  in `src/core/include-resolver-node.ts` — not a new failure.
- `git diff --name-only -- src/`: empty.
- Coverage (from the `npm test` run above, project-wide, not lock-file-
  specific): statements 95.44%, branches 90.47%, functions 96.95%, lines
  96.53% — all ≥ the 90/90/90 floor.
- No orphaned lock file (`/tmp` scan for `plantuml-ts-stdlib-build-*`:
  empty) and no stray worker/jiti process (`ps aux` scan: empty) left
  after the full test run + the guarded repro.

## Interface-contract result
```json
{
  "lockModule": "scripts/build-stdlib-packages/build-lock.ts",
  "exportedFunction": "acquireBuildLock",
  "signature": "(repoRoot: string, options?: BuildLockOptions) => () => void",
  "defaultLockPath": "os.tmpdir()/plantuml-ts-stdlib-build-<sha256(repoRoot).slice(0,16)>.lock",
  "defaultStaleAgeMs": 60000,
  "defaultStaleUnparseableGraceMs": 2000,
  "defaultPollIntervalMs": 50,
  "defaultMaxWaitMs": 30000
}
```

## Addendum — coordinator review: unparseable lock wedged every future run (fixed)

### Defect (coordinator's finding, verified independently)
`readLockContents` caught `JSON.parse` failures and returned `undefined`;
`reclaimIfStale`'s guard `if (contents !== undefined && isStale(...))` then
treated `undefined` as "nothing to reclaim" — an unparseable lock file
(a truncated write from a crash or a full disk, e.g. `{"pid":12345,"acqui`)
was NEVER judged stale, so `acquireBuildLock` looped until `maxWaitMs`,
threw, and every SUBSEQUENT run repeated the same 30s-stall-then-throw
forever, until a human deleted the file by hand. Stop 6 ("the lock can
wedge a future run"), correctly called.

### Mechanism chosen: mtime-based grace period, not rename-into-place
Two closing mechanisms were on the table. Chose the grace period because
it requires no change to the acquire path's proven exclusivity mechanism
(`wx` already provides correct mutual exclusion; the defect was ENTIRELY
in the stale-check's blind spot, not in acquisition itself), whereas
write-then-rename would need a SEPARATE exclusivity primitive layered on
top (POSIX `rename()` silently replaces an existing destination — it does
not fail if the target exists — so it cannot itself provide the "exactly
one caller wins" property `wx` gives for free; using it would require
inventing a second exclusive-create step anyway).

`observeLock` now returns a 3-way `LockObservation` (`'absent'` /
`'parsed'` / `'corrupt'`) instead of collapsing "no file" and "unparseable
file" into the same `undefined`. `'corrupt'` carries the file's own
`mtimeMs` (read via `statSync` in the SAME `try` as the `readFileSync`, so
a file that disappears between the two calls -- e.g. a concurrent release
-- reports `'absent'`, not a false `'corrupt'`). `isStale` treats
`'corrupt'` as stale only once `now() - mtimeMs > staleUnparseableGraceMs`
(new option, default **2000ms**).

**Why 2000ms closes the hazard without reopening the race the coordinator
warned about:** `writeFileSync(path, ..., {flag:'wx'})` is `open()` then
`write()` then `close()` — the benign window where a reader could see a
just-created, still-empty/partial file is the gap between those syscalls,
sub-millisecond for a ~60-byte JSON payload on any real filesystem. 2000ms
is ~1000x that margin, so it never mistakes a legitimately-mid-write fresh
lock for corruption, while still reclaiming a genuinely abandoned corrupt
lock in ~2s rather than permanently. Documented at both the constant
(`build-lock.ts:68-72`) and in the module's top-of-file doc comment.

**Restated, since it is the same shape of question as before:** the grace
period is a liveness check on the LOCK FILE, using its own mtime — NOT a
D4 violation. D4 governs whether build OUTPUT is up to date (content
hash, never count/mtime). This is the identical distinction already
drawn for the pid/`staleAgeMs` check; a later reader should not misfile
either as D4 territory.

### Two new tests (`tests/unit/build-stdlib-lock.test.ts`, now 8 tests)
7. **`reclaims a corrupt (unparseable) lock file and proceeds without
   hanging`**: writes the coordinator's own truncated content
   (`{"pid":12345,"acqui`) directly to a lock file, calls
   `acquireBuildLock` with `staleUnparseableGraceMs: 50` (short, so the
   test doesn't wait out the real default 2s) — asserts it acquires in
   under 1000ms (not the full `maxWaitMs`), logs both `reclaiming stale
   lock` and `unparseable content`, and the lock file is gone after
   release. Pins: **corrupt lock is reclaimed, build proceeds, no hang.**
8. **`does not steal a corrupt lock that is still within its unparseable
   grace period`**: same truncated content, but `staleUnparseableGraceMs:
   10_000` set deliberately longer than `maxWaitMs: 150` — the corrupt
   file's mtime cannot age past the grace period during the whole bounded
   wait, so it must never be judged stale, so `acquireBuildLock` MUST time
   out (asserted: throws) rather than ever reclaiming it. Asserts the lock
   file still exists afterward with its ORIGINAL untouched content
   (`readFileSync` equality) — proving no premature reclaim/theft
   occurred. This models the create-then-write race as a deterministic
   threshold test (the real microsecond-scale window is not reproducible
   on demand) rather than skipping the "no theft" property; pins: **a
   lock within its grace window is never stolen from what could be a live
   holder.**

Also updated test 4 (dead-process reclaim) with one new assertion:
`logs.some((m) => m.includes('waiting for the stdlib build lock'))` is now
asserted `false` for that case, pinning the "minor" logging fix below.

### Confirmation: corrupt-lock path now proceeds, raw output
Reproduced the coordinator's exact scenario against a real lock path
(production defaults, `staleUnparseableGraceMs: 2000` default, not the
test's shortened override) via a throwaway jiti probe:
```
[build-stdlib-lock] waiting for the stdlib build lock at <path>/coordinator-repro.lock
[build-stdlib-lock] reclaiming stale lock at <path>/coordinator-repro.lock (unparseable content, age 2045.06...ms)
ACQUIRED after 2046ms
lock still present? NO
```
Before this fix, this same input produced a 30000ms `THREW` timeout with
the lock file still present afterward (the coordinator's own repro
output). Now: acquires in ~2s, releases cleanly, lock file gone. Probe
script and its lock file were deleted after the run (not committed;
written to the session scratchpad).

Note: "waiting" IS logged here (unlike the dead-pid case) because this
lock genuinely could not be judged stale until its grace period elapsed —
it really did wait ~2s before reclaiming. The "minor" log fix only
suppresses "waiting" when a reclaim happens on the FIRST check with no
real wait (dead pid, immediately stale regardless of age) — it does not
suppress a truthful wait. Verified both paths behave correctly: test 4
(dead pid) asserts "waiting" absent; this probe (corrupt, within grace
then past it) shows "waiting" present, correctly, before the reclaim.

### Minor log-sequencing fix
`acquireBuildLock`'s loop now checks `if (reclaimIfStale(opts)) continue;`
immediately after a successful reclaim — retrying `tryCreateLockFile`
without first logging "waiting" or sleeping, since a just-reclaimed lock
is not a case of "blocked on a live holder." `reclaimIfStale` now returns
`boolean` (whether it reclaimed) instead of `void`, to let the loop tell
the difference.

### Re-run quality gates (measured on a re-settled machine)
- Machine settling: this fix's own test run again triggered
  `corespotlightd` churn (peaked ~230% after the 8-test run + probe).
  Polled `uptime`/`ps` every 15s until `corespotlightd` read 0.0 before
  taking the numbers below.
- `npm test`: 626 test files passed / 1 skipped (627); **16034** passed /
  2 skipped / 1 todo (16037) — 2 more than the pre-fix report (the two new
  tests). **Duration 56.68s.** `uptime` load1 **4.14** just before the run
  — under the 60.3s ceiling, in line with the 55.75-57.20s baseline range.
- `npm run typecheck`: exit 0, no output (both tsconfigs).
- `npm run lint`: exit 0, no output.
- `npm run build`: exit 0. Exactly the 3 pre-existing TS2591/TS2503 notes
  in `src/core/include-resolver-node.ts` — not a new failure.
- `git diff --name-only -- src/`: empty.
- No orphaned lock file (`/tmp` scan for `plantuml-ts-stdlib-build-*`:
  empty) and no stray worker/jiti/probe process (`ps aux` scan: empty).

### Updated interface-contract result
```json
{
  "lockModule": "scripts/build-stdlib-packages/build-lock.ts",
  "exportedFunction": "acquireBuildLock",
  "newOption": "staleUnparseableGraceMs",
  "defaultStaleUnparseableGraceMs": 2000,
  "mechanism": "mtime-based grace period on unparseable lock content, distinct from the D4 build-output staleness check",
  "coordinatorReproDelta": {
    "before": "THREW after 30000ms; lock still present",
    "after": "ACQUIRED after ~2046ms; lock removed"
  }
}
```
