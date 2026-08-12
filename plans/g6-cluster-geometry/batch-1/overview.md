# Batch 1 — Vertical/height residual (C9 priority 0)

Root-cause and fix the cluster vertical/height gap discovered by G5 C7
after the side-margin fix made widths jar-exact. ~1-6px, present on
every sample checked, NOT proportional to `innerMarginLevels`
(fevida and decede share level 1 but gap 6 vs ~1).

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T1 | Diagnose vertical residual; state mechanism + fix location | debugger | disposable probes only (deleted) | — | [x] |
| T2 | Fix at origin per T1's verdict; re-measure; tighten backlog | typescript-pro | see task file (conditional on T1) | T1 | [x] |

T1 produces no committed code — its deliverable is the mechanism
artifact appended to `decision-journal.md`. T2's commit is the batch's
only feature commit (plus a possible dot-engine issue-file commit).
