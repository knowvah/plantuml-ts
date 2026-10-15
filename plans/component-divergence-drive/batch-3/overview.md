# Batch 3 — canvas/margins/dpi; kermor group notes; text x/y diagnosis

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T4 | Canvas, margins, dpi (incl. deroxu dpi 60 + title) | typescript-pro | renderer chrome/canvas files (see spec) | T2 | [x] |
| T5 | kermor group-note drawing | typescript-pro | `renderer-cluster.ts` note path, kermor note files | T2 | [x] |
| T6 | Text x/y diagnosis (read-only) | debugger | none (report → `measurements/T6-diagnosis.md`) | T2 | [x] |

**One writer per file.** T4 and T5 must not both write `renderer-cluster.ts`. T5 owns it in this
batch. If T4's mechanism needs it, T4 reports it, and the orchestrator re-slots it to T5 or to batch 4.
Close: [../close-procedure.md](../close-procedure.md).
