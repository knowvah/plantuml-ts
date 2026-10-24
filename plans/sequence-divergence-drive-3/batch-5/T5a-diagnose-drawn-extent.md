# T5a — the canvas grows from every drawn primitive

Agent: `debugger` (sonnet), worktree `sdd3-T5a`. Commit:
`docs(sequence): diagnose drawn-extent canvas` (artifact), then
`fix(sequence): grow the canvas from drawn primitives` (fix, own commit).
Read [../task-contract.md](../task-contract.md) first.

## Mechanism (lead; verify in Java)
`SvgGraphics.java:129-135` `ensureVisible(x,y)` sets `maxX = (int)(x+1)` when
`x > maxX` (verified). `:854` (SEG_ARCTO of a path) calls `ensureVisible(
coord[5]+coord[0]+x+2*deltaShadow, coord[6]+coord[1]+y+...)`: endpoint plus
**rx**, not the arc's true extent (verified). Every other drawing method
calls it too (read each `driver` in `klimt/drawing/svg/`). Ours (kaluna-08-
rubu301, ws 2): the canvas is layout width plus `SEQUENCE_ENSURE_VISIBLE_
DELTA` = 1 (`assemble-svg-sequence.ts:~88`; `renderer-document.ts:53` `canvasOf`). First
find where sequence's canvas size is computed once B3's exporter change has
landed; `core/klimt/drawing/svg/svg-graphics-elements.ts` already holds the
driver port.

## Targets
kaluna-08-rubu301: ws to 0. Note any other row whose canvas follows the
same rule (D1: adding a matching row is push-forward).

## Write-set
Diagnosis: `plans/sequence-divergence-drive-3/diagnosis/drawn-extent.md`
only. Fix (after the artifact is complete): the files the artifact names,
journaled before the fix starts; if it needs core files, run the all-engine
survey.

## Read-set
`SvgGraphics.java:125-140,840-860`; `svg-graphics-elements.ts` (ensureVisible
sites); `assemble-svg-sequence.ts:85-130`; `renderer-document.ts:40-90`;
`tests/oracle/svg-conformance/sequence.*`.

## Acceptance
- Given the artifact, then mechanism, origin `file:line`, causal chain and
  ruled-out evidence are present; an incomplete one is stop 16.
- Given kaluna-08-rubu301 after the fix, then zero diff, with a unit test
  quoting `SvgGraphics.java:129-135,854` for the arc case.
- Given every engine's survey, then no conformant row is lost and canvas
  movers are explained row by row.
- Given the 1042 pins, then all stay byte-equal.

Observability: N/A — no new observable operations. Rollback: Reversible
(revert the task commit).
