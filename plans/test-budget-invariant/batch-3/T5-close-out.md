# T5 — Verify, correct SI36's close-out, close out

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/test-budget-invariant`. **You write no `src/`** — stop 1.

Read this brief's `README.md`, `decisions.md`, and **`decision-journal.md` in
full**. The journal outranks any task file it postdates.

**Your most important job is not the summary.** It is correcting a **published
claim in an already-merged mission**. Left standing, a future mission will act
on it.

## Task
1. **Correct SI36's close-out.** `plans/stdlib-lock-sharing/README.md` states
   the 120 s budgets are "provably over-provisioned" and proposes lowering
   them, reasoning from a max **wait** of 12,818 ms against 120 s (~9x). That
   **omits hold time**. A lock-using test's budget must cover **wait + hold**:
   the lock permits 30,000 ms of waiting, and T4 of that mission measured a max
   **hold** of 20,029 ms, so the legitimate worst case is ≈50 s and 120 s is
   ~2.4x. Amend the close-out in place, marked as a later correction with the
   date and this mission's name — **do not silently rewrite history**, and do
   not delete the original claim; show that it was corrected and why.
2. **Correct `planning/next-missions.md` item (b)**, which repeats the same
   "now provably over-provisioned" recommendation.
3. **Verify under real concurrency.** Run at least 3 concurrent pairs
   (`COVERAGE_ISOLATE=1` on both members — see `.agent-notes/coverage-tmp-race.md`)
   and report the pass rate honestly, with any failure signature quoted. State
   the load beside every run. If `catalog.test.ts` still trips at high load and
   T2 concluded `no-change`, that is expected — report it as the documented
   operating limit, not as a regression.
4. Append a `## Close-out (2026-XX-XX)` section to this brief's `README.md`:
   what the mechanism turned out to be, what the fitness test now prevents, the
   trial results, and your re-measured `npm test` wall-clock with the load.
5. **State the limits of the evidence.** A handful of trials is *consistent
   with* a fix, not proof of one. Match the standard SI35 and SI36 set.
6. Record residuals honestly — including that D2's fitness test deliberately
   stops at one level of same-file indirection, so a lock-using test that
   reaches the lock through a **cross-file** helper would not be caught.
7. Tick every batch in this brief's `README.md`.

## Write-set
- `plans/test-budget-invariant/README.md`
- `plans/stdlib-lock-sharing/README.md` (the correction)
- `planning/next-missions.md`
- `.agent-notes/tbi-T5.md`

## Read-set
- This brief's `README.md`, `decisions.md`, `decision-journal.md`
- `.agent-notes/tbi-T1.md`, `tbi-T2.md`, `tbi-T3.md`, `tbi-T4.md`
- `plans/stdlib-lock-sharing/README.md` close-out — the claim to correct
- `.agent-notes/lsh-T4.md` — max hold 20,029 ms, the number the claim omitted
- `.agent-notes/coverage-tmp-race.md` — why `COVERAGE_ISOLATE=1`
- `plans/stdlib-run-isolation/README.md` close-out — the honesty standard

## Acceptance
- Given SI36's close-out, then the over-provisioning claim is corrected in
  place, dated, attributed to this mission, and the original is visible rather
  than erased.
- Given `planning/next-missions.md`, then it no longer recommends lowering the
  120 s budgets.
- Given >=3 concurrent pairs, then the pass rate is reported with load readings
  and any signature quoted.
- Given `git diff --name-only main..HEAD -- src/`, then it is empty — quote it.
- Given the close-out, then residuals are stated, including D2's deliberate
  cross-file boundary.

## Observability requirements
N/A.

## Rollback
N/A — docs and verification only.

## Quality bar
Four gates green. Report `npm test` duration with `uptime` **and** the daemon
readings (`suggestd|corespotlightd|mds_stores|biomesyncd|BiomeAgent`), settled
first. Separate trial runs from measurement runs — a timing taken during a
concurrent trial measures the trial, not the suite.

## Boundaries
- **Always:** correct the published claim; state residuals; quote raw output.
- **Never:** touch `src/`; erase the original claim rather than correcting it;
  lower the 120 s value (stop 2); restate a number without a measurement; run
  any git write command.

## Report (<=350 tokens)
The correction as made; the trial pass rate with signatures; what remains open;
anything the orchestrator must fix before merge. No preamble.
