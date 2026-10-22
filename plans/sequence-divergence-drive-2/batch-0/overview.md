# Batch 0 — branch, tools, b0, pure-move splits

T0e first (branch, tools, pre-split hashes, b0), then T0a–T0d in parallel
worktrees off the T0e tip. Each split is a pure move (D4): callers keep
importing the old module, which re-exports what moved. The close replaces
classify/pin with a hash check: all 1141 rows identical on both paths to
`$M/b0-hashes.json` (stop 7).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T0e](T0e-branch-tools-b0.md) | branch, copy tools, b0 hashes + classify + survey + all engines, seed ledger | orchestrator | `$T/**`, `$M/b0*`, `fixtures.md`, `decision-journal.md` | — | [x] |
| [T0a](T0a-split-layout.md) | split `layout.ts` (547) | refactoring-specialist | `layout.ts`, new `sequence-layout-width.ts` | T0e | [x] |
| [T0b](T0b-split-participants.md) | split `sequence-layout-participants.ts` (510) | refactoring-specialist | it, new `sequence-layout-participant-constraints.ts` | T0e | [x] |
| [T0c](T0c-split-message.md) | split `sequence-layout-message.ts` (495) | refactoring-specialist | it, new `sequence-layout-message-self.ts` | T0e | [x] |
| [T0d](T0d-split-ast.md) | split `ast.ts` (480) | refactoring-specialist | `ast.ts`, new `ast-*.ts` | T0e | [x] |
| close | merge, gates, hash check vs b0 | orchestrator | per close-procedure (batch 0 variant) | T0a–T0d | [x] |

Paths are under `src/diagrams/sequence/`. Tests that import moved symbols
directly from the old module keep working through the re-exports; do not
edit tests.
