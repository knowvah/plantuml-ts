# SRI T0 — stdlib-run-isolation, D3 residual proven real

## Scope
Tests the ONE hypothesis SRE mission left as a documented-but-unobserved
residual (`plans/stdlib-build-race/decisions.md` D3, `.agent-notes/sre-T4.md`
"D3's residual"): if Run B's inputs genuinely change mid-run (not the
unchanged-inputs case T2's skip already closes), Run B's rebuild still
`rmSync`s the shared tree, and Run A's in-flight readers can still observe
it emptied/mid-rewrite. **This was deduced, never observed, until this
task.** No fix is written here (write-set: `scripts_scratch/T0/**` and this
file only).

## Mechanism
`writeOutputs` (`scripts/build-stdlib-packages.ts:142-155`) calls
`isGeneratedDirUpToDate` (`:120-132`); when the predicate is `false` —
which it correctly is whenever a build input genuinely changed — it calls
the still-unconditional `freshGeneratedDir` (`:49-54`,
`rmSync(generatedDir, {recursive:true,force:true})` then recreate), exactly
as SRE's T2/T4 fix intends. T2's skip and T4's cross-process lock both
operate correctly here — the lock (`build-stdlib-packages/build-lock.ts`)
serializes the two processes' *builds* against each other, and the
predicate correctly reports "stale" for genuinely different input content.
Neither mechanism claims to protect a **third** party: the *reader*
(`import()`s in a worker of the FIRST run, which may already be executing
outside any lock, since the lock covers `buildStdlibPackages()`'s own
critical section only, not anything downstream of it). When a second
process's build (with different content) runs its real, unconditional
`rmSync`+rewrite while the first process's reader is mid-`import()` of
`tupadr3.remote.js`, the reader observes the file absent (during the
`rmSync`-to-rewrite gap) and its `import()` throws.

## Origin
`scripts/build-stdlib-packages.ts:49-54` (`freshGeneratedDir`'s
`rmSync`) — reached via `writeOutputs:150` whenever
`isGeneratedDirUpToDate` correctly reports `false` for genuinely changed
input content. The lock (`build-lock.ts:264-292`) and the predicate
(`:120-132`) are both working exactly as designed; the origin is that
neither is a coordination primitive with a **reader outside the critical
section**, and none exists.

## Causal chain
1. `writer-mutate.ts` toggles a real build input (a throwaway `.puml`
   file's presence under `assets/stdlib/tupadr3/`) before every call to the
   real `buildStdlibPackages()` — a genuine change `readBundlePaths`
   (`scripts/build-stdlib-packages/emit-remote-manifest.ts:54-66`, called
   by `emitConcreteRemoteJs` -> `computePackageOutputs`) picks up, since it
   walks `assets/stdlib/tupadr3/` for every `.puml` file on every call.
2. `isGeneratedDirUpToDate` correctly hashes this as a mismatch on **every**
   iteration (confirmed: `grep -c "rebuild --"` on every writer log below
   equals the iteration count exactly — never a skip for `stdlib-tupadr3`),
   so `writeOutputs` runs the real `rmSync`+rewrite every time, unlike the
   SRE-T2-era harness where unchanged inputs made every call after the
   first a no-op.
3. Each such rebuild reacquires the lock, does the destructive
   rmSync-to-rewrite, releases the lock — all correct per T4. Nothing in
   this sequence is a bug; each rebuild is exactly what a genuinely-changed
   input should trigger.
4. A concurrent reader process (`reader-verify.ts`, cache-busting
   `import()` per attempt, same technique as the committed
   `tests/helpers/stdlib-build-race-reader.ts`) has no relationship to the
   lock at all — it never acquires it, was never designed to, and D3
   explicitly does not claim it should. If its `import()` lands inside
   any one rebuild's `rmSync`-to-rewrite window, it throws.
5. Observed twice directly (raw output below): `ENOENT: no such file or
   directory, open '.../packages/stdlib-tupadr3/generated/tupadr3.remote.js'`
   — the same failure class as SRE's original signature, differing only in
   exact wording (see "Wording delta" below).

## Ruled out (with evidence)
- **A defect in T2's predicate.** Ruled out by direct observation:
  `grep -c "rebuild --"` on every one of the 6 writer logs collected below
  (5 official + 1 confirmatory run with the committed reader) equals the
  writer's iteration count exactly (200/200 or 150/150) — the predicate
  never once reported "up to date" when the sentinel had genuinely
  toggled. The predicate is working exactly as T2 designed it; it is not
  the origin.
- **A defect in T4's lock.** Ruled out by construction and by the writer
  log: `buildStdlibPackages()` is called synchronously in a loop with no
  concurrent WRITER (only one writer process exists in this harness); the
  lock's job — serializing builds against other builds — is not what this
  residual is about, and no evidence of lock misbehavior (hang, double
  acquire, wedge) appeared in any of the 6 runs.
- **An artifact of `reader-verify.ts`'s own code** (the shape-check layer
  added on top of the committed reader). Ruled out directly: a
  confirmatory run using the **unmodified, committed**
  `tests/helpers/stdlib-build-race-reader.ts` against the same
  `writer-mutate.ts` reproduced the identical signature
  (`FAIL at attempt 42234: ENOENT: no such file or directory, open
  '.../tupadr3.remote.js'`) — the mechanism does not depend on anything
  `reader-verify.ts` added.
- **Truncated/mid-write silent corruption for THIS file size.** Actively
  looked for (see below) and not observed in any run — evidence, not
  absence of looking.

## Reproduction — raw output, 5 official runs
Harness: `scripts_scratch/T0/writer-mutate.ts 200 5` (200 real rebuilds,
5ms nominal delay — each rebuild independently forced by toggling a real
input) concurrently with `scripts_scratch/T0/reader-verify.ts 300000`,
launched together, reader force-killed 1s after the writer process exits.
Tree restored (sentinel removed, `buildStdlibPackages()` re-run to a
clean, current, byte-matching state) between every run.

| Run | Writer rebuilds | Reader raw output |
|---|---|---|
| 1 | 200/200 | `FAIL at attempt 18111: ENOENT: no such file or directory, open '/Users/scottseely/git/knowvah/plantuml-ts/packages/stdlib-tupadr3/generated/tupadr3.remote.js'` |
| 2 | 200/200 | *(no output — reader still mid-run, no collision inside the writer's active window; killed after writer exit, never reached the completion message either)* |
| 3 | 200/200 | *(no output — same as run 2)* |
| 4 | 200/200 | `FAIL at attempt 24540: ENOENT: no such file or directory, open '/Users/scottseely/git/knowvah/plantuml-ts/packages/stdlib-tupadr3/generated/tupadr3.remote.js'` |
| 5 | 200/200 | *(no output — same as run 2)* |

**Rate: 2/5 (40%).** Reported honestly, not tuned to force 5/5 — per this
task's explicit boundary. Mean attempts to fail, over the 2 runs that
fired: (18111 + 24540) / 2 = **21325.5**. The 3 non-firing runs are not
evidence against the mechanism — each made a large but unmeasured number
of attempts (a diagnostic variant, `reader-diag.ts`, measured a comparable
run at ~5.4 attempts/ms sustained through at least 42,000 attempts with no
slowdown, so "no collision in ~100s of writer runtime" reflects genuine
bad luck on the collision window, not an exhausted or stalled reader).

**Confirmatory run, unmodified committed reader** (rules out
`reader-verify.ts`'s own code as the cause — see "Ruled out" above):
`FAIL at attempt 42234: ENOENT: no such file or directory, open
'/Users/scottseely/git/knowvah/plantuml-ts/packages/stdlib-tupadr3/generated/tupadr3.remote.js'`.

## Wording delta from SRE-T0's recorded signature (noted, not a mechanism change)
SRE's `.agent-notes/sre-T0.md` recorded `Cannot find module
'.../tupadr3.remote.js'`. Every run in this task — including the
confirmatory run using the exact same unmodified
`tests/helpers/stdlib-build-race-reader.ts` file SRE-T0 used — instead
produced `ENOENT: no such file or directory, open '...'`. Both are the
Node ESM loader's response to the same underlying condition (the target
file absent at resolution time); the exact error surface/wording a dynamic
`import()` of a missing local file produces is not pinned by this task
(plausibly a Node version difference between sessions — not
independently verified here, out of this task's scope). This is a
**wording** difference only: same file, same missing-target condition,
same `ENOENT`-class root cause underneath either message.

## Silent-corruption check
`reader-verify.ts` validates every NON-throwing `import()`'s shape:
`tupadr3Remote.name === 'tupadr3'`, `files` is a non-empty object, every
value is a non-empty string ending in `.puml`. Across all 5 official runs
— each with tens of thousands of successful imports interleaved with 200
real rebuilds — **zero `SILENT` lines were logged.** Every import either
succeeded with a fully well-formed manifest or threw outright; none
returned truncated/mismatched content.

**How this was looked for, not just asserted:** the shape check runs
after every single successful import, for the full duration of every run,
against a manifest whose file count changes by exactly one entry each
toggle (small, easily corruptible if a read landed mid-`write()`).
**Why the negative result is credible, not just "didn't happen to see
it":** `tupadr3.remote.js` is small (single-digit KB — a Node.js
`writeFileSync` default 64KB buffer covers it in one `write()` syscall on
any filesystem in normal use), and Node's ESM loader (`fs.readFileSync`
under the hood for a `file:` URL) reads the complete file before handing
it to the parser — there is no streaming/partial-content code path for a
plain local `.js` module. A reader can observe the file **absent**
(mid-`rmSync`) or **complete** (post-write), but the window in which it
exists on disk in a truncated state is the sub-syscall interval within one
`write()` call — for a file this size, effectively unobservable from
another process. This is consistent with, not merely convenient for,
zero silent-corruption hits across ~100,000+ combined import attempts.

## Interface-contract result
```json
{
  "reproduced": true,
  "reproCommand": "( npx jiti scripts_scratch/T0/writer-mutate.ts 200 5 > writer.log 2>&1 ) & ( npx jiti scripts_scratch/T0/reader-verify.ts 300000 > reader.log 2>&1 ) & wait",
  "failureSignature": "ENOENT: no such file or directory, open '<repo>/packages/stdlib-tupadr3/generated/tupadr3.remote.js'",
  "meanAttemptsToFail": 21325.5,
  "silentCorruptionObserved": false
}
```

## Restore verification
Sentinel file (`assets/stdlib/tupadr3/_race-sentinel-T0.puml`, never
git-tracked — `assets/stdlib/` is wholly `.gitignore`d at
`.gitignore:66`) removed after every run; `packages/*/generated/`
rebuilt to a clean, current, byte-matching state via a final
`buildStdlibPackages()` call after every run. Final state:
```
$ git status --short
 M plans/stdlib-run-isolation/decision-journal.md
?? .agent-notes/sri-T1.md
?? scripts_scratch/
```
The two unexpected-looking lines are **not from this task**: the modified
`decision-journal.md` and `.agent-notes/sri-T1.md` belong to the sibling
T1 task running concurrently in this worktree (per the orchestrator's
mid-task message) — outside this task's write-set, left untouched.
`scripts_scratch/` is this task's own write-set, left in place per
instruction (not deleted). No modified tracked source anywhere; no stray
`writer-mutate`/`reader-verify`/`reader-diag`/jiti process left running
(`ps aux` scan, clean after every run).

## Quality gates
- `npm run typecheck`: exit 0, no output (both tsconfigs).
- `npm run lint`: exit 0, no output (scoped to `src tests demo` —
  `scripts_scratch/` is out of lint's scope, matching SRE precedent).
- `npm test` / `npm run build`: **deferred to the orchestrator's batch
  gate**, per the orchestrator's mid-task amendment — not run in this
  task, since both invoke `buildStdlibPackages()` via `globalSetup` against
  the same shared `packages/*/generated/` path this task's harness was
  actively racing, and a sibling task (T1) is running concurrently in this
  same worktree. No duration or load number is reported for either because
  neither was measured here.
- `git status --short`: clean of any tracked-source modification (see
  above); the two untracked lines shown belong to the concurrent sibling
  T1 task, not this one.

## What this does NOT do
No fix is proposed or written. This task's only output is the evidence
above and the harness that produced it. The residual documented at
`plans/stdlib-build-race/decisions.md` D3 and `.agent-notes/sre-T4.md`
is now **measured, not merely deduced**: real, reproducible at ~40% per
200-rebuild run under this harness, same failure class as the original
1-in-7 `stdlib-remote-e2e` flake, silent corruption actively checked for
and not found.
