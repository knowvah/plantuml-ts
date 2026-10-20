# Batch 0 — branch, b0, classifier, pin tool

Both tasks are independent and file-disjoint: run in parallel worktrees
(T0a creates the branch first; T0b's worktree is cut from it).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T0a](T0a-branch-b0-classify.md) | branch; b0 survey + classify + all-engine; seed `fixtures.md` | orchestrator + typescript-pro (classify.mts) | `$M/b0*`, `$T/classify.mts`, `$T/classify.test.mts`, `fixtures.md` | — | [x] |
| [T0b](T0b-pin-tool.md) | sequence pin tool; `pinned` status in both ratchet tests + re-pin script | typescript-pro | `$T/pin-goldens.mts`, `$T/pin-goldens.test.mts`, `sequence.golden.ratchet.test.ts`, `sequence.diff-baseline.ratchet.test.ts`, `scripts/repin-sequence-baselines.ts` | — (branch from T0a step 1) | [x] |

Close: no `close-procedure.md` run (nothing renders differently). Merge both,
run `gates.sh b0-gates`, commit `chore(sdd1-b0): baseline and tooling`.
