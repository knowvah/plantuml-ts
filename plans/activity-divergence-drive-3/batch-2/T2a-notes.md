# T2a — note families

Agent: typescript-pro, worktree `add3-T2a`. Rules: [../common-rules.md](../common-rules.md).

## Task
Opale margins (`Opale.java:56-59`; our `NOTE_H_PAD`/`NOTE_FOLD` overscan); `FtileNoteAlone` (floating notes); `FtileWithNotes` (two notes on one tile); notes attached to if/while/repeat/switch, each from its own builder's Java (`InstructionIf.java:137-160,222-227` threads notes into createIf, etc.); cross-lane notes (`FtileWithNoteOpale.java:86,92-99,217` swimlaneNote). Read add2's `.agent-notes/T3g.md` first.

## Write-set
See [overview](overview.md) row T2a; anything else: stop and report.

## Acceptance
- Each census NOTE row: note shape and geometry = jar, or the residual is named.
- 0 unexplained risers; every pinned golden byte-equal; harness-parity green.

Observability: N/A. Rollback: Reversible.
