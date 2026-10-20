# Batch 2 — component families, round 1

Four file-disjoint family tasks (T2d collapsed into T2b, journal row 22) in parallel worktrees, after batch 1b's
close. Each follows [family-contract.md](family-contract.md). T2e owns
`renderer.ts` in this batch (T3a owns it in batch 3). Then the orchestrator
runs [close-procedure.md](../close-procedure.md) as `b2` — pin round 1.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T2a](T2a-participants.md) | participant heads/tails + actor-family symbols | typescript-pro | `renderer-participant-shapes.ts`, `renderer-participant-symbol.ts`, `sequence-layout-participant-{sizing,label}.ts`, `sequence-layout-participants.ts` + tests | T1b, T1c | [x] |
| [T2b](T2b-lifeline-activation-destroy.md) | lifeline, activation box, destroy **+ T2d divider** | typescript-pro | `renderer-lifeline.ts`, `sequence-life-state.ts`, `sequence-layout-events.ts` (activation + divider geo only), `renderer-divider.ts`, `divider-style.ts` + tests | T1b, T1c | [x] |
| [T2c](T2c-arrows.md) | messages: normal, self, exo, dotted | typescript-pro | `renderer-message.ts`, `renderer-arrowhead.ts`, `renderer-arrowhead-glyph.ts`, `sequence-arrow-*.ts`, `sequence-layout-message.ts`, `sequence-layout-exo.ts` + tests | T1b, T1c | [x] |
| [T2d](T2d-divider.md) | divider / separator — **collapsed into T2b** | — | — | — | — |
| [T2e](T2e-notes-box.md) | notes + box (englober) | typescript-pro | `renderer.ts`, `sequence-layout-note.ts`, `sequence-note-tile.ts`, `layout.ts` (`computeBoxGeos` only) + tests | T1b, T1c | [x] |
| [T2f](T2f-lifeline-destroy.md) | lifeline, destroy cross, activation stereotype (T2b's stop 1, journal row 31) | typescript-pro | `renderer-lifeline.ts`, `layout.ts`, `sequence-delay.ts`, `sequence-layout-{events,activation,message}.ts`, `sequence-page.ts`, `scale-geo.ts`, `geo*.ts`, `ast.ts`, `parser.ts`, `sequence-skin-param.ts`, `renderer.ts` (lifeline fallback + destroy routing) + tests | T2b, T2c, T2e | [x] |
| close | re-pin, all-engine survey, pin round 1 | orchestrator | per close-procedure | T2a–T2e | [x] |

Where a family's geo is built in `layout.ts` or `sequence-layout-shared.ts`
(neither is in any write-set), the family sets `paint` from its own
`sequence-layout-*` module; a change that can only be made in `layout.ts` is
stop 1 — report it, and the orchestrator re-slots it.
