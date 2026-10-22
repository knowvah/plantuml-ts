# T0d — split `ast.ts` (pure move)

Agent: `refactoring-specialist`, worktree `sdd2-T0d`. Commit:
`refactor(sequence): split ast.ts by event kind`.
Read [../task-contract.md](../task-contract.md) first.

## Task
`src/diagrams/sequence/ast.ts` is 480 lines; Batches 1–3 add nodes
(LinkAnchor, url, `reverseDefine`, parallel). Split by event kind:
- `ast-message.ts`: `MessageExoType`, `AbstractMessageEvent`,
  `MessageEvent`, `MessageExoEvent` (`:67-152`);
- `ast-note.ts`: `NoteShape`, `NoteEvent` (`:153-200`);
- `ast-frame.ts`: `FrameEvent` (`:201-264`);
- `ast.ts` keeps `Participant`, the small events, the `SequenceEvent`
  union, `BoxGroup`, `SequenceDiagramAST`, and re-exports everything moved
  (`export type { … } from './ast-message.js'` etc.) so no import changes.

**Pure move:** types and comments only; no field renamed or reordered.

## Write-set
`src/diagrams/sequence/ast.ts`, new `ast-message.ts`, `ast-note.ts`,
`ast-frame.ts`. No test edits.

## Read-set
`ast.ts` (whole).

## Acceptance
- Given the split, then every file ≤ 300 lines and typecheck passes with no
  import edited elsewhere.
- Given `svg-hashes.mts` vs `$M/b0-hashes.json`, then 0 rows differ.
- Given `npm run catalog`, then the catalog regenerates (the orchestrator
  commits it at close).
