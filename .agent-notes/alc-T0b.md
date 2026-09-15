## Observation: lizard 1.23.0 mis-locates a TS function's end across an interface with a generic property type

- **Context**: Writing `scripts/repin-activity-baselines.ts` (T0b), the
  complexity hook (`hooks/check-complexity.py`, backed by
  `~/.claude/hooks/.venv`'s lizard 1.23.0) blocked `processDiffBaseline` at
  35 NLOC / `getCommit` at 20 NLOC, though both functions' own bodies are
  2-15 physical lines.
- **Finding**: When an `interface` declaration sits directly between two
  functions and any of its members has a generic type argument (confirmed
  triggers: `extends Record<string, unknown>`, and a plain property typed
  `Record<string, number>` or `Map<string, number>`), lizard's TypeScript
  tokenizer fails to recognize the interface as a new scope and folds its
  body into the PRECEDING function's NLOC -- sometimes cascading into
  functions further down the file. Reproduced in isolation: a 2-line
  `getCommit` sitting before two `extends Record<string, unknown>`
  interfaces measured at 15 NLOC; removing the generic (or moving the
  interface elsewhere) restored the true count. Same class of bug as the
  already-documented "regex literal breaks the TS tokenizer" trap
  (`~/.claude/projects/-Users-scottseely-git-graphviz-ts/memory/
  lizard-length-inter-comment.md`), triggered by generic angle brackets
  instead of a regex literal.
- **Impact**: Grouping every `interface`/`type` declaration into ONE block
  ahead of all functions (never sandwiched between two) avoids the bug
  entirely and is otherwise good organization. Do this by default in any
  TypeScript file this hook gates, rather than discovering it per file via
  blocked writes.
- **Confidence**: High (isolated, reproduced twice, root-caused to the
  `interface`+generic-property adjacency pattern).
