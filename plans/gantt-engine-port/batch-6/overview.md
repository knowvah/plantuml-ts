# Batch 6 — L11 (2824 Java lines)

Upstream layer L11: 34 files, none referencing another (same layer). Four parallel worktrees off the batch-5 close. `NaturalGanttCommand`, `CommandPrintBetween` and the `Subject*` classes are L12+ (batch 7). No gantt plugin yet: nothing renders differently, so the close expects
0 movers in all 28 engines. Standard close as `b6`.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T6a](T6a-commands-1.md) | commands A–H (681 lines) | typescript-pro (sonnet) | `src/diagrams/gantt/…` ×9 + tests | B5 | [ ] |
| [T6b](T6b-commands-2.md) | commands H–W (705 lines) | typescript-pro (sonnet) | `src/diagrams/gantt/…` ×8 + tests | B5 | [ ] |
| [T6c](T6c-complements-1.md) | lang complements A–D + DaysAsDates + VerbPhraseAction (843 lines) | typescript-pro (sonnet) | `src/diagrams/gantt/…` ×9 + tests | B5 | [ ] |
| [T6d](T6d-complements-2.md) | lang complements I–W (595 lines) | typescript-pro (sonnet) | `src/diagrams/gantt/…` ×8 + tests | B5 | [ ] |
| close | merge ×4, gates, chain vs b5 (0 movers) | orchestrator | per close-procedure | T6a, T6b, T6c, T6d | [ ] |
