# Batch 5b — Re-diagnosis D5–D8 (docs-only, parallel; may run with 5a and Batch 4)

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T16 | D5 — G20 linetype polyline/ortho (kejabo-83, pavuzo-79) | typescript-pro | `findings/G20-linetype-routing.md` | T8 | [x] |
| T17 | D6 — G22 dapunu-39 residual | typescript-pro | `findings/G22-dapunu-residual.md` | T8 | [x] |
| T18 | D7 — G18 bare single-node autonom (gokife-89) | typescript-pro | `findings/G18-single-node-autonom.md` | T9 | [x] |
| T19 | D8 — G16 tightContentDimension (jijuze-43) | typescript-pro | `findings/G16-region-leaf-margin.md` | T8 | [x] |

Expected manifest moves: none. T19 is the only task allowed gated tracing in
`src/` — reverted before it finishes; the orchestrator verifies `git diff` is
clean before committing.
