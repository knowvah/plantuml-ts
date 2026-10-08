# Batch 2 — exit and close-out (orchestrator)

| ID | Description | Writes | Depends On | Done |
|---|---|---|---|---|
| T-exit | final survey (`final-eng`), sequence scores, D5 element check b0 -> final, fill `final` column, verify each D6 clause with its evidence in README Status | `measurements/final*`, `fixtures.md`, README | b1 | [ ] |
| T-close-out | apply the three DIVERGENCES.md edits (retired or D2-narrowed), file follow-ons in `planning/next-missions.md` (lgm section), write the status memory, four gates, merge commit to main | `DIVERGENCES.md`, `planning/next-missions.md`, memory | T-exit | [ ] |

Never push; the user pushes.
