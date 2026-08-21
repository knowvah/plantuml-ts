# T0 — Reproduce the changed-inputs residual

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/stdlib-run-isolation`. **You write no `src/`** — stop 2. **You write no
fix.** This task produces evidence.

SI34 (`plans/stdlib-build-race/`) fixed the unchanged-inputs race and
documented what it did not fix. Read its close-out
(`README.md#close-out-2026-08-21`), its `decisions.md` D3, and
`.agent-notes/sre-T0.md` in full before starting. Do not re-derive what they
established.

## The hypothesis you are testing
Run A's `globalSetup` builds and **releases the lock**; A's workers then
begin importing from `packages/<pkg>/generated/`. Run B's `globalSetup`
legally acquires the now-free lock, finds the tree stale **because the source
genuinely changed**, and so rebuilds — `rmSync`ing the tree under A's
in-flight readers.

Unlike SI34's mechanism, **this has never been observed.** It is deduced.
Your job is to make it real or to kill it.

## Task
1. Build a harness under `scripts_scratch/T0/`. Process A imports
   `packages/stdlib-tupadr3/generated/tupadr3.remote.js` in a loop (SI34's
   committed reader at `tests/helpers/stdlib-build-race-reader.ts` already
   does exactly this — reuse it rather than reinventing). Process B calls the
   real `buildStdlibPackages()` while **mutating a build input between
   calls**, so the up-to-date predicate genuinely fails and B rebuilds.
2. Mutate a real input, not a fake one: something under `assets/stdlib/` that
   feeds `computePackageOutputs`, or a `PACKAGE_SPECS` entry. **Restore the
   tree and any mutated source before you finish** — verify with
   `git status --short` and say so.
3. Drive it until the reader fails, then make it reliable. Record attempts
   per run. Report the rate honestly if it is not 5/5.
4. Also determine whether the **silent** variant occurs: an import that
   resolves mid-rewrite and yields a mismatched or truncated module body
   rather than throwing. That failure mode is worse than the crash because
   nothing reports it. Say explicitly whether you saw it, and how you looked.
5. Write `.agent-notes/sri-T0.md` with the `rules/diagnosis.md` artifact:
   **Mechanism** · **Origin** (`file:line`) · **Causal chain** · **Ruled
   out** (with the evidence that eliminated each).

Read-only git only; no commits.

## Write-set
- `scripts_scratch/T0/**`
- `.agent-notes/sri-T0.md`

## Read-set
- `plans/stdlib-build-race/README.md` close-out · that mission's `decisions.md` D3
- `.agent-notes/sre-T0.md`, `.agent-notes/sre-T2.md`, `.agent-notes/sre-T4.md`
- `scripts/build-stdlib-packages.ts` and `scripts/build-stdlib-packages/build-lock.ts`
- `tests/helpers/stdlib-build-race-{reader,writer}.ts`

## Interface contracts
Report `{ reproduced: boolean, reproCommand: string, failureSignature: string,
meanAttemptsToFail: number, silentCorruptionObserved: boolean }`. T2's ADR
consumes all five; `reproduced: false` is a legitimate and useful answer.

## Acceptance
- Given the harness, when both processes run with genuinely changed inputs,
  then either the reader fails with a quoted signature, or you state plainly
  that it does not and what that rules out.
- Given a reproduction, when run 5 times, then quote all five.
- Given the artifact, then mechanism, origin, causal chain and ruled-out are
  all present with evidence.
- **Given no reproduction, then STOP and report** (stop 1). Do not widen the
  mutation, shrink the timing, or otherwise tune until it fires and then call
  that a reproduction. If it needs unrealistic conditions, that IS the
  finding — say what conditions were required.
- Given the tree, then `git status --short` is clean when you finish.

## Quality bar
Four gates green. Report `npm test` duration with the machine load — no hard
ceiling; the suite may take as long as it needs. Do not delete
`scripts_scratch/T0/`; the orchestrator removes it.

## Boundaries
- **Always:** use the real `buildStdlibPackages`; restore mutated source;
  quote raw output; state a load reading with every timing number.
- **Never:** touch `src/`; write a fix; report a tuned near-miss as a
  reproduction; run git write commands.

## Report (<=400 tokens)
The interface contract, the diagnosis artifact in full, and — if you could
not reproduce — exactly what you tried, under what conditions, and what that
eliminates.
