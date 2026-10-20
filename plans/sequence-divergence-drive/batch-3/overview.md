# Batch 3 — component families, round 2

Four file-disjoint tasks in parallel worktrees (T3d, T3e added 2026-10-20, journal rows 27, 30, 34), after the batch-2 close. Both
follow [../batch-2/family-contract.md](../batch-2/family-contract.md). No
close-procedure run here: batch 3b's close covers batches 3 and 3b (merge
both, `gates.sh b3-gates`, then T3c).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T3a](T3a-groups-ref-newpage-delay.md) | groups/partitions, ref, newpage, delay | typescript-pro | `renderer.ts`, `frame-style.ts`, `renderer-frame-header.ts`, `renderer-frame-blotter.ts`, `ref-body-geo.ts`, `newpage-style.ts`, `sequence-delay.ts`, `sequence-layout-events.ts` (frame/newpage geo), `sequence-layout-ref.ts`, `layout.ts` (newpage geo) + tests | b2 close | [ ] |
| [T3b](T3b-shadowing.md) | shadowing helpers onto `paint.shadowing` | typescript-pro | `sequence-shadow.ts`, `sequence-layout-note-shadow.ts` + tests | b2 close | [ ] |
| [T3d](T3d-arrow-colour-label-font.md) | per-message arrow colour; message label font | typescript-pro | `command-arrow*.ts`, `command-exo-arrow*.ts`, `command-return.ts`, `sequence-arrowhead.ts`, `sequence-arrow-paint.ts`, `sequence-layout-{message,exo,shared}.ts`, `renderer-message.ts`, `text-block-geo.ts` + tests | b2 close | [ ] |
| [T3e](T3e-notes-box-followups.md) | hnote hexagon, box stereotype, note colour refusal, transparent paint | typescript-pro | `ast.ts`, `command-note-factory.ts`, `command-grouping.ts`, `geo-annotation.ts`, `renderer-note.ts`, `sequence-layout-{note,box}.ts`, `sequence-skin-param.ts`, `renderer-participant-symbol.ts` + tests | b2 close | [ ] |
