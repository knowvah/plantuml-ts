# T3 — Implement the approved mechanism

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/stdlib-run-isolation`. **You write no `src/`** — stop 2.

**This task is not dispatchable as written.** The mission halts at batch 1
for the user's decision (D4, stop 3). Before dispatching, the orchestrator
MUST replace this section with the approved option from
`planning/adr/<NNN>-stdlib-run-isolation.md`, pin an explicit write-set, and
journal the user's decision with the date. An agent receiving this file with
this paragraph still present should **stop and say so** — it means the gate
was skipped.

## Task (fill from the approved ADR)
1. Implement the approved mechanism. TDD: tests first.
2. **Do not change what any package publishes** — `main`, `types`, every
   `exports` subpath, `files` — unless the approved ADR authorises it in as
   many words (D2; violating this is stop 5). If it does authorise it, the
   change must be exactly what was approved and no more.
3. Preserve the pack-based tests' ability to exercise the **real** published
   layout (D3). A seam that makes `npm pack` assertions pass by no longer
   testing the real thing is a regression disguised as a fix.
4. Log any new decision point so a future run is readable from output.
5. Verify against T0's harness: the residual it reproduced must now fail to
   reproduce. Quote before and after.

Read-only git only; no commits.

## Write-set
**Pinned by the orchestrator before dispatch, from the approved ADR.** Do not
write outside it; if the work requires a file no task owns, stop and report
(stop 4 in SI34's numbering, retained here in spirit).

## Read-set
- `planning/adr/<NNN>-stdlib-run-isolation.md` — the approved option
- `.agent-notes/sri-T0.md`, `sri-T1.md`, `sri-T2.md`
- `scripts/build-stdlib-packages.ts`, `scripts/build-stdlib-packages/build-lock.ts`
- `plans/stdlib-run-isolation/decisions.md` — D2, D3

## Acceptance
- Given T0's harness, when re-run, then the residual no longer reproduces —
  quoted before and after.
- Given `npm pack --dry-run --json` for all four packages, then the published
  file list is unchanged from `main` unless the ADR authorised a change.
- Given the suite, then `npm test` stays under 60.3 s on a settled machine —
  headroom is ~3 s, so measure and report it.
- Given the pack-based tests, then they still exercise the real layout.

## Quality bar
Four gates green, coverage >= 90/90/90, TDD. Complexity hook: >500
lines/file, >30 NLOC/function, CCN >10, >5 params — extract a NAMED helper,
never widen an exemption.

## Boundaries
- **Always:** re-run T0's harness as the proof; measure the suite.
- **Never:** touch `src/`; change the published surface without written
  authority; weaken a pack test to make it pass; run git write commands.

## Report (<=350 tokens)
The mechanism as built; the before/after on T0's harness; the pack file-list
comparison; the suite cost; the four gates.
