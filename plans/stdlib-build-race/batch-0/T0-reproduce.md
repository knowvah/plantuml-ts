# T0 — Reproduce the race and state the mechanism

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/stdlib-build-race`. **You write no `src/` and no fix** — this task
produces evidence, not a repair. Writing a fix here is out of scope even if
the cause becomes obvious.

You are re-opening a defect a previous mission left OPEN on purpose. Read
`.agent-notes/g1h-T2.md`, the observation titled "a 1-in-7 `stdlib-remote-e2e`
failure — OPEN, mechanism NOT isolated", **in full** before doing anything. It
records four things already ruled out WITH the evidence that ruled them out.
Do not re-derive them.

## The hypothesis you are testing
`freshGeneratedDir` (`scripts/build-stdlib-packages.ts:42-47`) opens with
`rmSync(generatedDir, { recursive: true, force: true })`, and `generatedDir` is
a fixed repo-absolute path from `__dirname` — so every concurrent `npm test`
shares one mutable tree. `tests/helpers/build-stdlib-globalsetup.ts`'s
guarantee ("globalSetup completes before any worker spawns") holds within ONE
vitest process and says nothing across two. Proposed: Run B's `globalSetup`
`rmSync`s the tree while Run A's worker imports out of it.

## Task
1. Build a two-process harness under `scripts_scratch/T0/` (D2): process A runs
   the **real** `buildStdlibPackages`, process B `import()`s
   `packages/stdlib-tupadr3/generated/tupadr3.remote.js` in a loop. Use the real
   function, not a reimplementation of it.
2. Drive it until the importer fails with the recorded signature, then make the
   repro **reliable** — it must fail on every run, not 1 in 7. Record how many
   attempts per run it needs.
3. Add the unit-level pin (D2 secondary): call `freshGeneratedDir` directly
   while an import is in flight.
4. Write `.agent-notes/sre-T0.md` containing the `rules/diagnosis.md` artifact:
   **Mechanism** (one or two sentences) · **Origin** (`file:line`) · **Causal
   chain** (why the observed symptom follows) · **Ruled out** (what you
   eliminated and the evidence).
5. Confirm the mechanism accounts for the recorded facts, naming each: the
   mtime inside the failing run, the unresolvable import, and the failing run
   being the only one at load1 ~17 and the slowest.

Read-only git only; no commits.

## Write-set
- `scripts_scratch/T0/**`
- `.agent-notes/sre-T0.md`

Nothing else. Nothing under `src/` — stop 2. **No fix** — that is T2/T4.

## Read-set
- `.agent-notes/g1h-T2.md` — the OPEN observation, in full
- `scripts/build-stdlib-packages.ts:38-60` — `freshGeneratedDir`, `buildPackage`
- `tests/helpers/build-stdlib-globalsetup.ts` — the doc comment, in full
- `tests/integration/stdlib-remote-e2e.test.ts:45-55` — the imported paths
- `plans/stdlib-build-race/decisions.md` — D1, D2

## Interface contracts
Report `{ reproCommand: string, failureSignature: string,
meanAttemptsToFail: number, reproducible: boolean }`. T1 consumes all four to
build the committed guarded test.

## Acceptance
- Given the two-process harness, when both run, then the importer fails with
  the `Cannot find module …/tupadr3.remote.js` signature.
- Given the repro, when run 5 times, then it fails 5/5 — quote the runs.
- Given the artifact, then it states mechanism, origin `file:line`, causal
  chain, and ruled-out with evidence.
- Given the mechanism, then it accounts for all three recorded facts by name.
- **Given reproduction does NOT occur, then you STOP and report** — you do not
  proceed to a fix, do not weaken the hypothesis to fit, and do not report a
  near-miss as a reproduction. State what you tried and what it rules out.

## Observability
N/A — no new observable operations. (The harness's own output is evidence, not
instrumentation of the product.)

## Rollback
Reversible. Scratch harness plus one note; nothing committed to the build.

## Quality bar
Four gates green. `npm test` under 60.3 s **measured on a settled machine** —
check `uptime` first; this repo has burned four investigations on confounded
readings. Do not delete `scripts_scratch/T0/` — T1 needs it. The orchestrator
removes it after T1 lands.

## Boundaries
- **Always:** use the real `buildStdlibPackages`; quote raw output as evidence.
- **Never:** touch `src/`; write any fix; report "probably" as a reproduction;
  run git write commands.

## Report (<=400 tokens)
The interface contract above, plus the diagnosis artifact in full, and — if you
could not reproduce — exactly what you tried and what it eliminates.
