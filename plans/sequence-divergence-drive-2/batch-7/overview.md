# Batch 7 — remaining structural families

Mechanisms: `research/research-d-structure.md` §1 (clusters D, E, F, G2, J,
N, O, P, Q, Z, AA, AB, AC, AD). Re-measure each cluster at the B6 close
first — creole routing may have moved some rows.

Sub-batches: 7a (four tasks ∥) → 7b (two ∥) → 7c. Core lifts are additive
(D6); the close runs the all-engine survey.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T7a](T7a-message-drawing.md) | 7a · self circles + dressing1 (F), multicast (J), part-anchor no-draw (Z) | typescript-pro (sonnet) | `renderer-message.ts`, `renderer-arrowhead.ts`, `sequence-arrowhead.ts`, `sequence-layout-message.ts` + tests | B6 | [x] |
| [T7b](T7b-activation-edges.md) | 7a · activation-group edge cases (N) | typescript-pro (sonnet) | `renderer-lifeline.ts`, `sequence-layout-activation.ts` + tests | B6 | [x] |
| [T7c](T7c-group-end-note.md) | 7a · group-end note (G2); transparent group-comment runs (AC) | typescript-pro (sonnet) | `command-grouping.ts`, `sequence-layout-frame.ts`, `renderer-frame-header.ts`, `renderer-frame-blotter.ts` + tests | B6 | [x] |
| [T7d](T7d-singletons.md) | 7a · stereotype title (AA), base64 sprite (AB), spot glyph (P) | typescript-pro (sonnet) | `src/core/stereo/Stereotype.ts`, `command-sprite.ts`, `renderer-participant-shapes.ts`, new core glyph module + tests | B6 | [x] |
| [T7e](T7e-warning-banner.md) | 7b · skinparam deprecation banner (D) | typescript-pro (sonnet) | new `src/core/skinparam-warnings.ts`, `activity-warnings.ts`, sequence `index.ts`, `render-fixture-sequence.ts` + tests | T7a–T7d | [x] |
| [T7g](T7g-message-padder.md) | 7b · message padder (O) | typescript-pro (sonnet) | `sequence-skin-param.ts`, `geo-message.ts`, `renderer-message.ts` + tests | T7a–T7d | [x] |
| [T7f](T7f-document-chrome.md) | 7c · gradient background (Q), border (AD), handwritten (E) | typescript-pro (opus) | `renderer.ts`, `src/core/assemble-svg.ts` (split first) + tests | T7e, T7g | [x] |
| close | standard close **with the all-engine survey**, pin round 7 | orchestrator | per close-procedure | all T7 | [x] |

Paths under `src/diagrams/sequence/` unless marked. Research D's Y
(`</?style>` close) is in Batch 8 (core preprocessor).
