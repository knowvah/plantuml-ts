# T1c: `PSystemListEmoji`

Prepend [../task-preamble.md](../task-preamble.md). Agent: typescript-pro (sonnet).

## Task (TDD)
Port `emoji/PSystemListEmojiFactory.java` (`emoji` or `startsWith("emoji ")`, java:50) and
`emoji/PSystemListEmoji.java` (149 lines: the "Emoji available on Unicode Block X" header + block
list, a TreeMap by prefix, rows of `<:code:>` glyph + `<#0:code:>` + shortcut) over the existing
index (`src/core/klimt/creole/Emoji.ts:36,230-248`) and artwork store (`src/core/internal-emoji-store.ts`).
Jar values: the 7 `emoji <block>` rows (`unknown/vedine-65-rafo449` … `xozane-18-becu956`).

## Write-set
`src/diagrams/emoji/{PSystemListEmoji,PSystemListEmojiFactory}.ts`, their unit tests under `tests/unit/` (mirror the source path), `docs/catalog.md`,
`.agent-notes/ufp-T1c.md`. Any OTHER file is a stop — in particular NOT `src/index.ts` (T2a
registers every plugin) and not `oracle/goldens/**`.

## Interface contract (→ T2a)
Export `listEmojiPlugin` (a `singleLinePlugin`, or the base-class plugin shape T0c landed) and the
factory's accept function; record the exact export names in the report.

## Acceptance
- Given the 7 corpus rows, then compareSvg has zero diffs (or residuals named).
- Given a line the factory does not accept (and a 4-line source), then it refuses.
- Given each corpus row rendered three times, then the outputs are identical.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible.
