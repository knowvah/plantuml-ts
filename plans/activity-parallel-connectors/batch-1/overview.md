# Batch 1 — `Tile.hasPointOut()`

One task, deliberately a **no-op on rendered output**: the query T2 and
T3 gate on is threaded first so each consumer's move is attributable.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | `hasPointOut()` on every tile, per `FtileGeometry` | typescript-pro | `src/diagrams/activity/tiles/tile.ts`, `gtile-stop.ts`, `gtile-end.ts`, `gtile-kill.ts`, `gtile-top-down.ts`, `gtile-fork.ts`, and every other `tiles/gtile-*.ts` for its own citation; `tests/diagrams/activity/tiles/gtile-simple-leaf.test.ts`, `gtile-top-down.test.ts`, `gtile-fork.test.ts` | — | [ ] |

**Stop condition 6 applies:** the aggregate must be EXACTLY 43977 after T1.
