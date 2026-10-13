# Batch 1a: openiconic, colors, emoji list, archimate list

All tasks run in parallel worktrees (disjoint write-sets); 1a and 1b may run together. None registers its plugin — T2a does, in upstream order. Close with the standard procedure (`../close-procedure.md`); with no plugin registered the survey cannot move, so the close is gates + journal + an all-engine survey proving 0 movers.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T1a](T1a-openiconic.md) | `PSystemOpenIconic` + `PSystemListOpenIconic` | typescript-pro (opus) | `src/diagrams/openiconic/{PSystemOpenIconic,PSystemOpenIconicFactory,PSystemListOpenIconic,PSystemListOpenIconicFactory}.ts` | batch 0 | [ ] |
| [T1b](T1b-colors.md) | `PSystemColors` (full grid + hexagon palette) | typescript-pro (opus) | `src/diagrams/eggs/{PSystemColors,PSystemColorsFactory}.ts` | batch 0 | [ ] |
| [T1c](T1c-emoji.md) | `PSystemListEmoji` | typescript-pro (sonnet) | `src/diagrams/emoji/{PSystemListEmoji,PSystemListEmojiFactory}.ts` | batch 0 | [ ] |
| [T1d](T1d-archimate-list.md) | `PSystemListArchimateSprites` | typescript-pro (sonnet) | `src/core/klimt/sprite/{PSystemListArchimateSprites,PSystemListArchimateSpritesFactory}.ts` | batch 0 | [ ] |

## As landed (T0c/T0d/T0e — filled at the batch-0 close)

(orchestrator records the exact exported signatures here before launching batch 1)
