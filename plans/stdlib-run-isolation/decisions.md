# Architecture decisions — stdlib-run-isolation

Locked at planning, 2026-08-21. A task that finds a conflicting constraint
**stops and journals it** (stop 7) rather than silently overriding.

## D1 — Reproduce the changed-inputs residual before designing anything

**Context.** SI34 proved its mechanism before writing a fix, and that
discipline is why the fix is trustworthy. The residual this mission targets
has never actually been observed — it was *deduced* from the lock's release
semantics. That is a weaker starting position than SI34 had.

**Decision.** T0 must reproduce it: two processes, the second building
**genuinely changed** inputs while the first's reader imports. If it cannot
be reproduced, the mission STOPS (stop 1) and the outcome is a permanent
documented acceptance, not an isolation mechanism.

**Consequences.** The mission can legitimately end at T0 having proven the
hole is unreachable in practice. That is a *good* result and must not be
treated as failure. Building isolation for an unreproducible symptom would
add machinery, and a permanent maintenance surface, for nothing.

## D2 — The published surface of the four stdlib packages is sacred

**Context.** `generated/` is `main`, `types`, and every `exports` subpath for
`stdlib`, `stdlib-aws`, `stdlib-tupadr3` and `stdlib-all`.
`packages/*/package.json` `files` ships it. `stdlib-package-files.test.ts`
and `sprite-package-files.test.ts` assert on what `npm pack` actually
publishes.

**Decision.** No task may change what any package publishes unless the
approved ADR says so in as many words. A test-only seam that leaves
`main`/`types`/`exports`/`files` byte-identical is always preferable to
relocating the canonical tree.

**Consequences.** Rules out the naive "just build somewhere else" reading of
per-run isolation. Isolation, if adopted, most likely means *readers* resolve
through a seam while the canonical tree stays exactly where it is.
Violating this is stop 5.

## D3 — `npm pack` is the constraint that shapes every option

**Context.** `sprite-package-files.test.ts:81` runs `npm pack --dry-run
--json` and `:182` reads `generated/*.js` off the canonical path. Pack
resolves `files: ["generated"]` against the real package directory. It
cannot be redirected by a seam.

**Decision.** Every option in T2's ADR must state explicitly what happens to
the pack-based tests. An option that silently breaks them, or that quietly
stops them exercising the real published layout, is disqualified — say so
rather than discovering it in batch 2.

**Consequences.** Full isolation is probably impossible: at least one test
genuinely requires the canonical tree populated. The honest goal is
therefore reducing the number of concurrent readers of the shared path, not
eliminating them. The ADR must be candid about that ceiling.

## D4 — Do not re-adopt the declined option by agent authority

**Context.** The user declined a per-run isolated output directory on
2026-08-21 for packaging blast radius. This mission re-opens the question
**with measurements**, because SI34's close-out justified the decision
against an under-count (two import sites; the real number is at least six).

**Decision.** T2 presents options with measured cost and a recommendation,
then the mission **STOPS** (stop 3). Only the user resumes it. No agent may
begin implementing any option, including the recommended one, before that.

**Consequences.** Batch 2's task files are deliberately written against "the
approved option" rather than a named design. That is not vagueness; it is the
decision boundary.

## D5 — A negative result must be published as prominently as a fix

**Context.** SI34's most valuable durable output was arguably not its code
but its correction of a doc comment that had misdirected an entire prior
mission.

**Decision.** If this mission stops at T0 (unreproducible) or the user
chooses "accept permanently", T5 still runs: it records the exposure
measurement, the reader census, and the reasoning, in
`plans/stdlib-build-race/README.md`'s residual section and
`planning/next-missions.md`. The next person must find the analysis, not
repeat it.

**Consequences.** "We looked and decided not to" is a shippable deliverable
here, and it is written up to the same standard as code would be.

## Routing

Autonomous execution. **T0** (diagnosis) gets `debugger`; **T2** (the ADR)
gets `architect-reviewer`; the rest get `typescript-pro`. All sonnet.
