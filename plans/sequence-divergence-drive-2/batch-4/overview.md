# Batch 4 — text placement

Mechanisms: `research/research-a-text.md` (83 rows, all explained; 0
pinned exposure if each fix is gated on participant type / badge / align
/ exo direction). T4a ∥ T4b, merged, then T4c (shares
`sequence-layout-exo.ts` with T4b).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T4a](T4a-participant-labels.md) | stick-kind labels, badge rows, queue margin | typescript-pro (sonnet) | `sequence-layout-participant-label.ts`, `sequence-layout-participant-sizing.ts`, `renderer-participant-shapes.ts`, `geo-participant.ts` + tests | B3 | [x] |
| [T4b](T4b-exo-labels.md) | exo labels E1–E3 | typescript-pro (sonnet) | `sequence-layout-exo.ts` + tests | B3 | [x] |
| [T4c](T4c-message-align.md) | `SequenceMessageAlign` / arrow `HorizontalAlignment` | typescript-pro (sonnet) | `sequence-arrow-paint.ts`, `sequence-layout-message.ts`, `text-block-geo.ts`, `sequence-layout-exo.ts` + tests | T4b | [x] |
| close | standard close, pin round 4 | orchestrator | per close-procedure | T4a–T4c | [x] |
