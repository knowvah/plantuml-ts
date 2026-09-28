# Batch 2: diagnose every non-conformant CLASS row

T6–T9 run in parallel, one shard each (shards are assigned in `fixtures.md` by T5).
They are **read-only on `src/`**: each writes only its own `diagnosis/<shard>.md`,
so no worktrees are needed. T10 consolidates.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T6](T6-T9-diagnose-shard.md) | diagnose shard S1 (text) | debugger (opus) | `diagnosis/S1-text.md` | T5 | [x] |
| [T7](T6-T9-diagnose-shard.md) | diagnose shard S2 (edge) | debugger (opus) | `diagnosis/S2-edge.md` | T5 | [x] |
| [T8](T6-T9-diagnose-shard.md) | diagnose shard S3 (structure) | debugger (opus) | `diagnosis/S3-structure.md` | T5 | [x] |
| [T9](T6-T9-diagnose-shard.md) | diagnose shard S4 (style/shape) | debugger (opus) | `diagnosis/S4-style.md` | T5 | [x] |
| [T10](T10-families.md) | families, ranking, generate batch 3–5 specs, journal target | orchestrator | `diagnosis/families.md`, `batch-{3,4,5}/*`, `fixtures.md`, journal | T6–T9 | [x] |

All four shards share one spec, `T6-T9-diagnose-shard.md`. The executor passes the
shard id and file name.

Name each agent (`cdd5-S1` … `cdd5-S4`) so it can be resumed with `SendMessage`.
The resumed agent's second report may not arrive (memory:
subagent-handback-single-shot). Read its diagnosis file instead.

**Verify agent claims before T10 builds on them** (memories:
verify-agent-claims-si31, agents-correct-the-orchestrator). For at least 2 rows
per shard, the orchestrator re-opens the cited Java `file:line` and the port
`file:line` and confirms the quote.
