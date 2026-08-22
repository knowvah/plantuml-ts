# T4 — Re-measure and verify

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/stdlib-lock-sharing`. **You write no `src/`** — stop 1. **You write no
fix.** This task is the mission's verdict.

Shared mode has landed (T1) and readers now use it (T2), with the builder
explicitly exclusive (T3). The claim under test: reader-versus-reader waiting
has collapsed, without weakening the invariant that a reader is never
mid-read while a builder `rmSync`s `packages/<pkg>/generated/`.

## Task
1. Re-run T0's harness (`scripts/measure-lock-contention.ts`) in both
   configurations — single run, and a concurrent pair with
   `COVERAGE_ISOLATE=1`. Produce the same contract table T0 produced, so the
   two are directly comparable.
2. Present **before/after side by side**, using T0's own baseline as the
   before. Do not restate the README's figures — use T0's measured note.
3. Run **at least 5 concurrent pairs** end to end and report the pass rate
   honestly, with any failure's signature quoted. For reference, before this
   mission: 2 of 6 shared runs and 1 of 6 isolated runs failed, all with
   `Timed out after 30000ms waiting for the stdlib build lock`.
4. Confirm the safety invariant still holds. The proof that matters is a
   builder genuinely rebuilding (a `rebuild --` log line, not `skip`) while
   readers are active — mirror `plans/stdlib-run-isolation`'s T5 method:
   toggle a throwaway `.puml` under `assets/stdlib/tupadr3/`, which
   `readBundlePaths` (`scripts/build-stdlib-packages/emit-remote-manifest.ts:54-66`)
   walks, so the content hash genuinely flips. **Restore any mutated source
   and confirm `git status --short` when you finish.**
5. **State the limits of your evidence.** A handful of trials is *consistent
   with* a fix, not proof of one. SI35's close-out was explicit about this and
   that framing is the standard to match.
6. Write `.agent-notes/lsh-T4.md`.

## If waiting has NOT materially dropped
That is **stop 8**. Report it with the numbers and the mechanism you can
establish. Do **not** tune constants, raise `maxWaitMs`, or re-run until a
better sample appears (stop 6). A redesign that did not work is a finding.

## Write-set
- `.agent-notes/lsh-T4.md`
- `scripts_scratch/T4/**` (probes; the orchestrator deletes these)

## Read-set
- `.agent-notes/lsh-T0.md` — the authoritative baseline
- `scripts/measure-lock-contention.ts` — T0's harness
- `.agent-notes/stdlib-lock-budget.md` — the original diagnosis
- `plans/stdlib-run-isolation/README.md` close-out — the honesty standard and
  the straddling-rebuild method

## Interface contracts
Report per configuration: `{ configuration, acquisitions, totalWaitMs,
totalHoldMs, meanHoldMs, maxHoldMs, maxWaitMs, timeouts }`, plus
`{ concurrentTrials: number, failures: number, signatures: string[] }`.
T5 publishes these verbatim.

## Acceptance
- Given both configurations, then before/after are quoted side by side from
  measurements, not from the README.
- Given >= 5 concurrent pairs, then the pass rate is reported honestly with any
  failure signature quoted.
- Given a builder rebuilding for real while readers are active, then no reader
  observed a torn or missing tree — with the `rebuild --` line quoted as proof
  the build was genuine.
- Given the evidence, then its limits are stated plainly.
- Given the tree, then `git status --short` is clean of mutated source.

## Observability requirements
N/A — this task measures, it does not instrument.

## Rollback
N/A — no production code changes.

## Quality bar
Four gates green. Report `npm test` duration with the load; wait for
`corespotlightd` ~0 before **any** timing number. Note the measurement trap:
concurrent trials are themselves the condition under test, so timing taken
during a trial is worthless — separate trial runs from measurement runs.

## Boundaries
- **Always:** re-measure; quote raw output; restore mutated source; state
  limits.
- **Never:** touch `src/`; tune a constant to improve a number; re-roll trials
  until they look good; run any git write command.

## Report (<=400 tokens)
Before/after table; concurrent-trial pass rate with signatures; the safety
proof; the limits; the four gates. No preamble.
