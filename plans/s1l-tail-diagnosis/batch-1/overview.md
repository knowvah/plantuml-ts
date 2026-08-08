# Batch 1 — seven parallel diagnosis tasks

Every task is **read-only against `src/`** and writes exactly one findings
file, so there are zero write conflicts by construction and all seven run in
parallel.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T1 | container-cluster, 9 fixtures | debugger | `findings/container-cluster.md` | — | [x] |
| T2 | sprite, 5 fixtures | debugger | `findings/sprite.md` | — | [x] |
| T3 | element-font, 5 fixtures | debugger | `findings/element-font.md` | — | [x] |
| T4 | creole titled separators (S1L-i), 2 fixtures | debugger | `findings/creole-titled-separator.md` | — | [x] |
| T5 | multi-line quoted display (S1L-j), 2 fixtures | debugger | `findings/multiline-display.md` | — | [x] |
| T6 | other, 2 fixtures | debugger | `findings/other.md` | — | [x] |
| T7 | icon, 1 fixture | debugger | `findings/icon.md` | — | [x] |

## Why the buckets are not re-cut for balance

T1 carries 9 fixtures and is the long pole. It is deliberately NOT split:
`kovaxi-11`/`zidebi-71` (both 0.772) and `lesori-32`/`ravodu-50` (both 0.2429)
are identical-delta pairs, which `CLAUDE.md` identifies as the strongest
available signal of a single shared cause. Splitting the bucket across two
agents puts each pair in a separate context and destroys that signal. Same
reasoning keeps `loroto-06`/`toxine-81` (both 0.0833) together inside T3.

## Orchestration rules

- **Parallel agents share the worktree.** No agent may run a state-mutating
  git command. The orchestrator commits after the batch.
- One commit per completed task, referencing the task ID:
  `docs(T1): container-cluster mechanism table`.
- Agents do not auto-load `~/.claude/rules/`. Each task file names the rules
  it requires; the agent must READ them before relying on them.
- Subagents use Serena MCP tools for symbol navigation (`find_symbol`,
  `find_referencing_symbols`, `search_for_pattern`), not the LSP tool.

## Batch exit bar

- All 26 fixtures have a record on the [SCHEMA](../findings/SCHEMA.md).
- Every identical-delta pair is reconciled (shared cause named, or explicitly
  refuted with evidence).
- `git diff --name-only` contains no `src/` path.
- `npx tsx scripts/measure-description-size-deltas.ts` still reports 321/351,
  widened 0.
- Quality gates green (see [README](../README.md#quality-gates)).
