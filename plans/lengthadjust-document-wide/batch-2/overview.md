# Batch 2 — klimt-shaped engines and the four re-routed engines

Six tasks in parallel worktrees off the batch-1 close; write-sets are
disjoint. T2a–T2e set both carriers (D3: `option.lengthAdjust` on the klimt
graphic AND `fragment.lengthAdjust`); T2c–T2e first add `getlengthAdjust()`
to their port SkinParam (D1). T2f gives board, files, packetdiag and chart
their `diagramType` (T1a's literals) and the field — the one task whose
survey verdicts are expected to move (D2; stop 8 allows exactly these four
engines). Then the standard close as `b2`, re-pinning the four engines'
`parity-*.json`.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T2a](T2a-activity.md) | activity: fragment field + `option.lengthAdjust` on the text and creole sheets | typescript-pro (sonnet) | `src/diagrams/activity/{renderer,activity-text-sheet,activity-creole-sheet}.ts` (+ T0d-named mirror) + test | B1 | [x] |
| [T2b](T2b-description.md) | description (component/usecase/c4): option + fragment | typescript-pro (sonnet) | `src/diagrams/description/renderer.ts` + test | B1 | [x] |
| [T2c](T2c-mindmap.md) | mindmap: `getlengthAdjust()` + option + fragment | typescript-pro (sonnet) | `src/diagrams/mindmap/{mindmap-skin-param,index}.ts` + test | B1 | [x] |
| [T2d](T2d-wbs.md) | wbs: same | typescript-pro (sonnet) | `src/diagrams/wbs/{wbs-skin-param,index}.ts` + test | B1 | [x] |
| [T2e](T2e-salt.md) | salt: same | typescript-pro (sonnet) | `src/diagrams/salt/{PSystemSalt,index}.ts` + test | B1 | [x] |
| [T2f](T2f-generic-engines.md) | board/files/packetdiag/chart: `diagramType` + field | typescript-pro (sonnet) | `src/diagrams/{board,files,packetdiag,chart}/renderer.ts` + tests | T1a (B1) | [x] |
| close | merge ×6, gates, baseline rebuild, chain vs b1 and b0, re-pin the four parity files | orchestrator | per close-procedure | T2a–T2f | [x] |

Expected authored movement at the close: every remaining `none`/`glyphs` row
→ `rootExact`; `textLengthMatch` true on every `exact` row; the 12 D2
`baseline` rows unchanged or better.
