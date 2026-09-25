# T19c — note on link: colour and gradient

**Agent:** typescript-pro (sonnet, effort high) · **Depends on:** T18 ·
parallel with T19a, T19b (disjoint write-sets, worktrees).
Prompt = [`../fix-task.md`](../fix-task.md) + this file.

## Fixtures

lipazi-06-care921, nuvake-96-gofe203, lozego-15-coci435 (b4: 11/29,
11/51, 7/27). Source shape: `note on link #red: ...`,
`note left on link #blue ... end note`; lozego uses a gradient colour
(jar emits a `<linearGradient>` def, we emit none).

## Mechanisms (diagnose first — T18's 30-minute pass only)

- First diffs: the note-on-link body `path/@fill` exp `#F00` act
  `#FEFFDD`, `@stroke` exp `#00F` act `#181818`, `@stroke-width` exp 0.5
  act 1, and a `text` vs `path` swap in the next group. Find where the
  `#color` on `note ... on link` is parsed (upstream
  `CommandNoteOnLink`-family, `classdiagram/command/`) and where the note
  paint is resolved; check the jar's stroke-width 0.5 (a note-on-link
  opale stroke) and the `text`/`path` swap before editing. lozego: port
  the gradient (`HColorGradient`) paint through the same path.

## Write-set

`src/diagrams/class/class-command-notes.ts`, `class-notes.ts`,
`class-note-decl-ast.ts`, `class-note-link-box.ts`,
`class-edge-note-box.ts`, `renderer-note.ts`, `renderer-note-lines.ts`,
`renderer-note-dispatch.ts`, `renderer-note-connector.ts`,
`note-opale.ts`, tests beside each, `.agent-notes/cdd2-T19c.md`.
NOT `note-layout-tip.ts` (T19a).

## Acceptance criteria

- Given the three fixtures, when rendered, then structural diffs are 0
  and the remaining numerics are attributed
- Given the 601 conformant class fixtures, when render-all runs, then none
  leaves conformant

## Observability · Rollback

N/A. Reversible.
