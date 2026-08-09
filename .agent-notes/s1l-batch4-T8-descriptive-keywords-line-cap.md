## Observation: `descriptive-keywords.ts` was already over the 500-line cap

- **Context**: T8 (description-leaf-sizing-audit, batch-4) added the
  `archimate` `KEYWORD_SYMBOL_ENTRIES` entry (+22 lines, mostly a doc
  comment explaining why it maps to `'rectangle'`, not a new USymbol tag)
  to `src/core/descriptive-keywords.ts` via the Edit tool.
- **Finding**: `git show HEAD:src/core/descriptive-keywords.ts | wc -l` =
  502 lines — already 2 lines over the project's 500-line cap BEFORE this
  task's edit. After the edit: 524 lines. The Edit tool call did not error
  or block, confirming (same as G1b/J1's `layout.ts` finding) that the
  cap either isn't enforced on Edit-tool calls to already-over-cap files,
  or only warns.
- **Impact**: not fixed here — splitting `descriptive-keywords.ts` (the
  single source of truth for `KEYWORD_TO_SYMBOL`/`ALL_TYPES`/the
  `hasDescriptiveSignal`/`hasDescriptiveElement` guards) is a structural
  refactor well outside T8's declared write-set (`descriptive-keywords.ts`
  content changes only) and risks the same "refactor while porting"
  regression class `pr-workflow.md` warns against. Logged per that same
  policy (pre-existing violation in a file this task touched for an
  unrelated reason; not a >3-line "fix in place" case since it's a
  whole-file-size issue, not a discrete bug).
- **Confidence**: High (measured directly via `git show`/`wc -l`).
