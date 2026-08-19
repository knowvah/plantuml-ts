# T3 — Core seams through `Sea`: `creole-text-lines.ts` + `leaf-sizing-text.ts`

Return only the structured result — no preamble, no trailing summary. Do not
infer unstated requirements; do not spawn subagents.

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch `feat/creole-exposant-port`.
The two engine-local seams size creole lines WITHOUT the jar's altitude
engine: `creole-text-lines.ts` (SI29 T1's `creoleTextLines`, consumed by
state; `:48-54` flags `<sup>` as unported) and `leaf-sizing-text.ts` (class
leaf/member text; `:92,:180,:244` read `atom.font.size`). Jar: `SheetBlock1
.initMap` (`SheetBlock1.java:114-150`) builds a `Sea` per line, `Sea.doAlign`
places each atom at `y = −height + startingAltitude` (`Sea.java:72-80`),
`translateMinYto` stacks lines, and the line height is `Sea.getHeight()`. Our
`Sea.ts` (`:60-131`) is ported and tested (`tests/unit/core/klimt/creole/Sea.test.ts`).
Read `decisions.md` D1/D2/D3/D7 (locked), the batch overview contract, T1's
journal row, CLAUDE.md.

## Task
1. `creole-text-lines.ts`: for each physical line, build the runs' dimensions
   with `getFont(atom.font)` and lay them through `Sea` (an `AtomOps` over the
   seam's atoms: text dim = measurer with muted font, altitude =
   `getSpace`); emit per run `size` (muted) and `dy` = the run's Sea baseline
   minus the line's NORMAL baseline (baseline = position.y + height −
   descent, descent from `measurer.getDescent(mutedFont, text)`,
   `AtomText.java:213-215`); `line.height = sea.getHeight()`. NORMAL-only
   lines MUST produce today's width/height/`dy: 0` (README stop 9 —
   pin with a test over the existing fixtures' expectations).
2. `leaf-sizing-text.ts`: same for class leaf/member text — expose per-atom
   `{size, dy}` and the Sea line height in whatever shape T4 needs (name it in
   the report; keep class byte-identical for NORMAL text).
3. Remove the `:48-54` unported flag; cite the Java per rule.
TDD first: `<sup>1</sup>` after a tab (juvagu's line), `<sub>`, nested
`<size:20><sup>`, an emoji + sup on one line, a NORMAL identity case.

## Write-set
As in the batch overview. If `Sea.ts`/`SheetBlock1.ts` need a change, STOP
and report (T1 owned klimt; a Sea change is a mission-level decision).

## Read-set
`decisions.md#D2,#D3`; `creole-text-lines.ts` (whole); `leaf-sizing-text.ts:1-300`;
`src/core/klimt/creole/Sea.ts` (whole) + its test; `SheetBlock1.ts:100-160`;
`src/core/measurer.ts:1-40,80-100`; Java `klimt/creole/Sea.java:60-110`,
`SheetBlock1.java:114-150`, `AtomText.java:175-193,197-233`.

## Acceptance
- Given runs of one line, then per-run `dy` and `line.height` come from `Sea` (D2); NORMAL-only lines identical to today (identity test) — width, height, `dy: 0`.
- Given juvagu's `\t<sup>1</sup>…` line, then run.size == muted, `dy` == Sea placement, and the line width equals the jar's `svek-1.dot` box minus margins (T0's before-numbers give the target).
- Given `<size:20><sup>x</sup></size>` and the reverse nesting, then run.size == 17.
- Given `harness-diff.py`, then 0 rows appeared or grew (state renderer drift is a Batch-3 concern, but SIZES only shrink here); `npm test` wall-clock within +10 % of 54.8 s (stop 11).

## Observability / Rollback
Harness rows; wall-clock. Reversible.

## Report (≤600 tokens)
Final run/line types (T4/T5 read this); the `AtomOps` you built for the seam;
NORMAL identity proof; juvagu numbers before/after; wall-clock; files written.
