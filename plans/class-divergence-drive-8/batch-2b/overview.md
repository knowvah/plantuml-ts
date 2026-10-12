# Batch 2b: ELK cluster + edge drawing

Starts after batch 2a closes (`ElkDiagramAdapter` frozen). The two tasks run in parallel
in worktrees and write disjoint files. `MyElkDrawing` (batch 2c) constructs both
classes, so they land first. Close via [../close-procedure.md](../close-procedure.md):
gates, journal and a light survey, with no pins expected. Every agent prompt is
[../batch-1/task-preamble.md](../batch-1/task-preamble.md) followed by the task file.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T2c](T2c-myelkcluster.md) | port `MyElkCluster` (172 lines) | typescript-pro (sonnet) | `src/core/elk/MyElkCluster.ts` (+tests) | T2a | [x] |
| [T2d](T2d-myelkedge.md) | port `MyElkEdge` (354 lines) | typescript-pro (opus) | `src/core/elk/MyElkEdge.ts` (+tests) | T2a | [x] |
