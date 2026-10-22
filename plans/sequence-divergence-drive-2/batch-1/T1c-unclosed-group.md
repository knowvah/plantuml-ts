# T1c — a group still open at EOF keeps its events

Agent: `typescript-pro` (sonnet), worktree `sdd2-T1c`. Commit:
`fix(sequence): keep events of groups left open at end of diagram`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism (research D cluster C, probe-verified)
Upstream keeps a flat event list (`sequencediagram/SequenceDiagram.java:
411-446`); `teoz/GroupingTile.java:160-163` consumes events until END **or
the end of the iterator**, so an unclosed `alt`/`group` still draws its
frame and everything inside it. The port pushes frames
(`command-grouping.ts:157`) and pops on `end` (`:249`), but
`parser.ts:319-373` (`runDispatchLoop`) never drains `state.frameStack` at
EOF: the frame and all its events vanish. Research D's probe: appending
`end`×N gives structural = 0 on all 7 rows. Read the Java to decide what
the drained frame looks like (no END event) — appending synthetic `end`s
is the probe, not necessarily the port.

## Targets
jedado, notube, cazusa, nosebu, xezipe, debufa, diruxe: 0 structural
sites.

## Write-set
`src/diagrams/sequence/parser.ts`, `command-grouping.ts`, their tests.

## Read-set
`research/research-d-structure.md` cluster C; `parser.ts:300-380`;
`command-grouping.ts:140-261`; `teoz/GroupingTile.java:140-230`;
`SequenceDiagram.java:400-450`.

## Acceptance
- Given `alt x` / `A -> B` with no `end`, when rendered, then the frame and
  the message are drawn as the jar draws them (unit test on geo).
- Given the 7 targets, then each has 0 structural diffs.
- Given the 419 pins, then none changes.
