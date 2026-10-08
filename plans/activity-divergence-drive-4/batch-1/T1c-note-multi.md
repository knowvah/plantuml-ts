# T1c — NOTE-MULTI canvas ink + note colour (D3)

Agent: typescript-pro, worktree `add4-T1c`. Rules: [../common-rules.md](../common-rules.md).
Read `.agent-notes/add3-T3c.md`, `add3-T3j.md`, `add3-T2a.md` first.

## Task
1. Canvas extent: `FtileWithNotes` wraps each Opale in `TextBlockMarged`, whose `drawU`
   draws a full-box `UEmpty` (`TextBlockMarged.java:51-58,74-81`) — LimitFinder counts it;
   our `layout/canvas-origin*.ts` ink scan does not (T3j added it to compression only).
2. `note #color` (and other note colour forms): parse into an `ActivityNote.color`
   (`CommandNote3.java`, `CommandNoteLong3.java` colour group) and fill the Opale with it.
Rows: giteso-65-mefo026 (440), mifejo-31-sovi184, tajuxe-32-sexo680, kavoro-11-jife299
(width part only if not lane width), xolazi-74-vamu265, tuneta-22-mega154, jageti-56-kume076.

## Write-set
`layout/canvas-origin*.ts`, the note branches of `node-dispatch.ts`, `ast.ts` (note colour
field), `tiles/gtile-with-notes.ts`, `layout/walk-with-notes.ts`,
`activity-renderer-note-shapes.ts`, tests, `tests/fixtures/activity/add4-T1c/**`.

## Acceptance
- Given giteso/mifejo/tajuxe, then canvas width/height = jar or residual named.
- Given a `note #color` fixture, then the note fill = jar.
- 0 risers; element counts never decrease; pins byte-equal.
Observability: N/A. Rollback: Reversible.
