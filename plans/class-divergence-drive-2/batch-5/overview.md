# Batch 5 — stretch pairs (D9)

Runs only if T18 measured conformant ≥ 600. T18 writes the task files
here; until then this overview is the whole batch.

Candidate pairs (identical or near-identical signature in `b-plan.json`):

| pair / family | S+N each (b-plan) |
|---|---|
| ponono-25-fevo574 · sumocu-27-vubo674 | 62+75 (identical sources) |
| pejone-71-tige404 · xonamo-50-podo529 | 220+~1040 |
| puvono-84-doro361 · sekame-22-meze147 | 2+1360 |
| vudepo-27-cuvo793 · lejoga-79-poji465 | ~85+~405 |
| xenere-07-kuji864 · sijoba-16-rari847 | ~7+~210 |
| bidusa-22-jutu505 · ruliki-78-biji661 | 1+50 (ORA5a) |
| lipazi-06-care921 · nuvake-96-gofe203 · lozego-15-coci435 | path fill, Δ5 (lozego: no `<linearGradient>`) |
| givofi-11-xumu978 · popesa-39-sobe866 | gradient/def id; popesa = def-id seed filing |
| pecabi-95-demu756 · sanixi-31-nofa193 | 0+2, Δ4.89 (identical sources; note on package) |
| givoli-70-rade072 · tekena-28-fobe713 · nadepi-13-mufu566 | 0+24, Δ0.82 |

T18 read-only pass (render-diff on `b4` tree, journal row 40). Pairs
confirmed by identical first diffs. Three families have a stated or
cheaply diagnosable mechanism and disjoint write-sets → tasks; seven are
filed in `planning/next-missions.md` at T20 with their first-diff
signatures (ponono/sumocu text wrap; pejone/xonamo title vs entity, 220
S; puvono/sekame edge routing, width +161; vudepo/lejoga entity order;
givofi/popesa gradient order + def-id seed; givoli/tekena/nadepi one
edge Δ10; bidusa/ruliki sprite sizing in member rows, core sprite code).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T19a](T19a-note-connector-magnetic.md) | note connector magnetic border (pecabi, sanixi) | typescript-pro | `note-layout-tip.ts` + tests | T18 | [ ] |
| [T19b](T19b-cluster-header-stereo-legend.md) | cluster header stereotype + legend (xenere, sijoba) | typescript-pro (opus) | `class-namespace-usymbol-shape.ts`, `class-namespace-shape.ts`, `class-namespace-title*.ts`, `class-container.ts`, `ast.ts`, `parser.ts`, new `class-cluster-header.ts` + tests | T18 | [ ] |
| [T19c](T19c-note-on-link-colour.md) | note-on-link colour + gradient (lipazi, nuvake, lozego) | typescript-pro | `class-command-notes.ts`, `class-notes.ts`, `class-note-decl-ast.ts`, `class-note-link-box.ts`, `class-edge-note-box.ts`, `renderer-note*.ts`, `note-opale.ts` + tests | T18 | [ ] |
| close | [`../close-procedure.md`](../close-procedure.md) | orchestrator | — | T19a, T19b, T19c | [ ] |

T19a ∥ T19b ∥ T19c in worktrees.
