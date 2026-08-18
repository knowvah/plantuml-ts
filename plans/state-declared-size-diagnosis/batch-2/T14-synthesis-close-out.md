# T14 — SYNTHESIS + close-out (Opus)

Return only the structured result — no preamble, no trailing summary.

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`docs/state-declared-size-diagnosis`. Read `README.md`, `decisions.md`,
`findings/SCHEMA.md`, `findings/PARTITION.md`, every `findings/*.md` from
T1–T13, `decision-journal.md`, and the precedent
`plans/s1l-tail-diagnosis/findings/SYNTHESIS.md` for shape.

## Task
1. `python3 findings/check-schema.py` → must be `94 records, 0 violations`
   (or the T0-measured total). If not, list the violations for the
   orchestrator; do not edit other tasks' files.
2. `findings/SYNTHESIS.md`: re-partition ALL fixtures by TRUE mechanism
   (ADR-3), pivoting on `sharedCauseWith` and identical |Δpx|; per group:
   mechanism · `originFileLine` · `javaRef` · fixtures (with bucketLabel
   provenance) · rows count · proposed write-set · size estimate · confidence
   · pairingRisk summary. Then a **fix-mission batch proposal**: batches with
   disjoint write-sets, biggest-delta-first, each naming its exit (harness
   rows → exact). List `unresolved` groups with their `nextStep`, and every
   `divergence-proposed` for maintainer ruling (ADR-6). List T13's proposed
   harness improvement as a T0 candidate for the fix mission.
3. Re-run `npx jiti scripts/measure-composite-declared-size.ts --mismatched-only`
   and `cmp` with `test-results/state-declared-size-baseline.jsonl` — must be
   byte-identical (README stop 3 otherwise).
4. `README.md`: tick all batches; append "Close-out (date)": exit bar 1–5
   scored with numbers, groups count, unresolved count, flags, follow-ups.
5. `planning/mission-index.md`: SI28 row after SI27 (same table shape).
   `planning/next-missions.md §4`: replace the state-composite bullet with a
   DONE line pointing at SYNTHESIS.md and naming the fix mission.

## Write-set
`findings/SYNTHESIS.md`, `README.md`, `planning/mission-index.md`,
`planning/next-missions.md`.

## Acceptance
- Given the findings, then every fixture is in exactly one true-cause group; every repeated |Δpx| is one group or explicitly reconciled.
- Given SYNTHESIS, then the fix-batch proposal's write-sets are pairwise disjoint.
- Given the final tree, then the harness output equals the T0 baseline and `git diff --name-only <branch-point>` has no `src/ tests/ oracle/ scripts/` path.

## Observability / Rollback
N/A. Reversible.
