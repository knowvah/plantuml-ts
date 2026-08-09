## Observation: oracle jar's EmbeddedDiagram sizes are the 42x42 catch fallback
- **Context**: R2b (mission A2s round 2) fixing xadado-92-lazo250 {{...}} notes.
- **Finding**: In the deterministic DOT-dump oracle environment, the jar NPEs
  in `EmbeddedDiagram.calculateDimensionSlow` (PortableImageAwt.image null)
  and takes the `catch` path returning `new XDimension2D(42, 42)`
  (EmbeddedDiagram.java:150). Probe DOT (2026-08-05) is byte-identical to
  the pinned golden: every embedded-diagram note measures 0.875x0.902778in
  == (42+6+15) x (42+13+2*5) px. So class goldens encode the FALLBACK size,
  not a real nested render.
- **Impact**: When a real `NestedDiagramRenderer` is wired (seam in
  `EmbeddedDiagram.ts`, consumed by `note-layout-measure-rows.ts#
  consumeEmbeddedRow`), port sizes will diverge from these goldens unless
  measurement deliberately keeps the fallback (or the oracle env is fixed
  upstream). Re-pin or ledger at that point.
- **Confidence**: High (jar probe, byte-identical DOT diff).
