# Batch 1 — note gaps, unported commands, unclosed group

Three file-disjoint tasks in parallel worktrees, after the batch 0 close.
Mechanisms: `research/research-d-structure.md` §2 (error rows), clusters
C, G1, U. Then the standard close as `b1` — pin round 1. Error rows that
start rendering are promoted, not counted as silent wins (stop 16).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T1a](T1a-note-gaps.md) | URL group on note regexes; note after an exo arrow | typescript-pro (sonnet) | `command-note-factory.ts`, `command-exo-arrow.ts` + tests | B0 | [x] |
| [T1b](T1b-unported-commands.md) | `CommandActivate2`, `CommandUrl` + head link, `hide <<g>> stereotype` | typescript-pro (sonnet) | `command-lifeline.ts`, `command-misc.ts`, `command-common.ts`, `sequence-command-registry.ts`, `renderer-participant-symbol.ts` + tests | B0 | [x] |
| [T1c](T1c-unclosed-group.md) | events inside a group open at EOF are kept | typescript-pro (sonnet) | `parser.ts`, `command-grouping.ts` + tests | B0 | [x] |
| close | standard close, pin round 1 | orchestrator | per close-procedure | T1a–T1c | [x] |

Paths under `src/diagrams/sequence/`.
