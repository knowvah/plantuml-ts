# Batch 3 — component families, round 2

Two file-disjoint tasks in parallel worktrees, after the batch-2 close. Both
follow [../batch-2/family-contract.md](../batch-2/family-contract.md). No
close-procedure run here: batch 3b's close covers batches 3 and 3b (merge
both, `gates.sh b3-gates`, then T3c).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T3a](T3a-groups-ref-newpage-delay.md) | groups/partitions, ref, newpage, delay | typescript-pro | `renderer.ts`, `frame-style.ts`, `renderer-frame-header.ts`, `renderer-frame-blotter.ts`, `ref-body-geo.ts`, `newpage-style.ts`, `sequence-delay.ts` + tests | b2 close | [ ] |
| [T3b](T3b-shadowing.md) | shadowing helpers onto `paint.shadowing` | typescript-pro | `sequence-shadow.ts`, `sequence-layout-note-shadow.ts` + tests | b2 close | [ ] |
