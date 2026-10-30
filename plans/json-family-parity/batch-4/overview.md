# Batch 4 — remaining port-controlled mechanisms

Written at the B1 close (amendments 2026-10-29 / 2026-10-30 in `../decisions.md`).
The ledger's port-controlled mechanisms that are neither M1 nor M2 and not
ruled out (M4 left as is, Q3): **M5** and the declared-size half of **M3**.
Serial: T4b starts from the T4a merge (both touch json layout/render paths).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T4a](T4a-scale-at-emit.md) | M5: scale at emit, after 1x layout (nuzaje, timafu) | typescript-pro (sonnet, effort high), jfp-T4a | `src/diagrams/json/{scale-geo.ts,JsonCurve.ts,renderer.ts,document-dimensions.ts,index.ts}`, `tests/unit/json/scale-*.test.ts` | b3 close | [ ] |
| [T4b](T4b-empty-container-size.md) | M3: engine gets `calculateDimension`, MIN_WIDTH draw-only, no label when empty (12 json rows) | typescript-pro (sonnet, effort high), jfp-T4b | `src/diagrams/json/{TextBlockJson.ts,layout.ts,record-label.ts,json-node-position.ts}`, `tests/unit/json/{empty-container-size.test.ts,record-label.test.ts,TextBlockJson.test.ts}` | T4a merge | [ ] |
| close | merge each; gates `b4`; chain vs b3; D5 check; residue vs b3 (no rise, stop 4); re-pins | orchestrator | per close-procedure | T4a, T4b | [ ] |
