# Batch 0 — classify the rows; land the seam as a no-op

T0 and T1 are independent (disjoint write-sets); run T1 in an isolated
worktree so T0's render-all reads a tree nobody is editing. T1's commit
merges after T0 lands and is re-verified against T0's `base.json`.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T0 | Classify the 22 rows by connection class; read `UGraphicInterceptorOneSwimlane` for D5; confirm or strike D9 | debugger | `fixtures.md`, `measurements/`, `decision-journal.md`, `.agent-notes/allt-T0.md`, `planning/next-missions.md` (re-filings only) | — | [x] |
| T1 | The seam: `LoopTranslate` on `EdgeMeta`, array `routeEdge` with reservations, `midArrowAt`, stub shape modules; byte-identical output | typescript-pro | see spec | — | [ ] |

Specs: [`T0-classify.md`](T0-classify.md), [`T1-seam.md`](T1-seam.md).
Batch close: aggregate `weightedScore` recorded in the journal (never gated).
