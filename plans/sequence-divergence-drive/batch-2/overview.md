# Batch 2 — component families, round 1

Four file-disjoint family tasks (T2d collapsed into T2b, journal row 22) in parallel worktrees, after batch 1b's
close. Each follows [family-contract.md](family-contract.md). T2e owns
`renderer.ts` in this batch (T3a owns it in batch 3). Then the orchestrator
runs [close-procedure.md](../close-procedure.md) as `b2` — pin round 1.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T2a](T2a-participants.md) | participant heads/tails + actor-family symbols | typescript-pro | `renderer-participant-shapes.ts`, `renderer-participant-symbol.ts`, `sequence-layout-participant-{sizing,label}.ts`, `sequence-layout-participants.ts` + tests | T1b, T1c | [ ] |
| [T2b](T2b-lifeline-activation-destroy.md) | lifeline, activation box, destroy **+ T2d divider** | typescript-pro | `renderer-lifeline.ts`, `sequence-life-state.ts`, `sequence-layout-events.ts` (activation + divider geo only), `renderer-divider.ts`, `divider-style.ts` + tests | T1b, T1c | [ ] |
| [T2c](T2c-arrows.md) | messages: normal, self, exo, dotted | typescript-pro | `renderer-message.ts`, `renderer-arrowhead.ts`, `renderer-arrowhead-glyph.ts`, `sequence-arrow-*.ts`, `sequence-layout-message.ts`, `sequence-layout-exo.ts` + tests | T1b, T1c | [ ] |
| [T2d](T2d-divider.md) | divider / separator — **collapsed into T2b** | — | — | — | — |
| [T2e](T2e-notes-box.md) | notes + box (englober) | typescript-pro | `renderer.ts`, `sequence-layout-note.ts`, `sequence-note-tile.ts`, `layout.ts` (`computeBoxGeos` only) + tests | T1b, T1c | [ ] |
| close | re-pin, all-engine survey, pin round 1 | orchestrator | per close-procedure | T2a–T2e | [ ] |

Where a family's geo is built in `layout.ts` or `sequence-layout-shared.ts`
(neither is in any write-set), the family sets `paint` from its own
`sequence-layout-*` module; a change that can only be made in `layout.ts` is
stop 1 — report it, and the orchestrator re-slots it.
