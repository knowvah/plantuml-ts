# Batch 2 — cluster-box fix; childCount family

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T2 | Cluster-box fix from the T1b artifact | typescript-pro | `renderer-cluster.ts`, `layout.ts`, files T1b named | T1b | [x] |
| T3 | childCount family (missing/extra elements) | typescript-pro | `renderer.ts`, `renderer-draw-sequence.ts`, `renderer-edge.ts`, files the mechanism names | T0 | [x] |

T2 and T3 run in parallel. If T1b's write-set and T3's mechanisms overlap on a file, collapse the
overlapping part into T2 and journal it (one writer per file).
Close: [../close-procedure.md](../close-procedure.md).
