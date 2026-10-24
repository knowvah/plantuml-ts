# T1f — `\r` / `\l` in a label sets the Display's natural alignment

Agent: `typescript-pro` (sonnet), worktree `sdd3-T1f`. Commit:
`fix(sequence): honour backslash-r and backslash-l label alignment`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism (sdd2: `natural-align-dropped`; Java re-read)
`Display.getWithNewlines` records the LAST escape in the text:
`\r` sets `naturalHorizontalAlignment = RIGHT`, `\l` LEFT
(`klimt/creole/Display.java:290-298`), and `create0` lets it override the
caller's alignment: `if (getNaturalHorizontalAlignment() != null)
horizontalAlignment = getNaturalHorizontalAlignment()`
(`:644-649`). Ours: `displayLines` flat-maps `splitDisplayLines(...).lines`
and throws the returned `align` away (`text-block-geo.ts:102-104`;
`core/klimt/creole/DisplayNewlines.ts:359-376`), and `sequenceTextBlock`
rebuilds the Display with `Display.create(lines)` (`sequence-creole-sheet.ts:
292`), which carries no natural alignment. jigigi's label is
`123\n456789\rright\nfin`: the jar right-aligns the whole block.
Find the narrowest seam: keep `displayLines`'s signature (many callers);
add a sibling that returns lines AND the natural align, and have the caller
that builds the message label's `LabelOptions` (`sequence-creole-sheet.ts:
260-300`) apply `align = natural ?? align`. If the natural align must be
carried from a file outside the write-set (message label layout), that is
stop 1: report the call chain, do not edit.

## Targets
jigigi-69-bege021 to 0 (3 units).

## Write-set
`src/diagrams/sequence/sequence-creole-sheet.ts`, `text-block-geo.ts` and
their tests. (500-line cap: `sequence-creole-sheet.ts` is 459 — a pure-move
split is allowed, journal it.)

## Read-set
`text-block-geo.ts:60-104`; `sequence-creole-sheet.ts:255-300,340-400`;
`core/klimt/creole/DisplayNewlines.ts:340-376`; Java: `Display.java:280-300,
640-660`; fixture `tests/corpus/sequence/jigigi-69-bege021.puml`.

## Acceptance
- Given a label `a\nbb\rc`, when its block is built, then its alignment is
  RIGHT whatever the component's own (unit test citing `Display.java:293-297,
  648-649`); `\l` gives LEFT; no escape leaves the alignment unchanged.
- Given jigigi, then it diffs to 0.
- Given the 1042 pins, then every pin stays byte-equal (labels with `\n`
  only must not move).

Observability: N/A — no new observable operations. Rollback: Reversible
(revert the task commit).
