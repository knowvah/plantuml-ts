# T5 — State engine consumers (juvagu-33 closes here)

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch `feat/creole-exposant-port`.
State consumes the core seam through `state-sizing-creole.ts` (SI29 T6;
`StateTextRun` at `:71-90`, `:33-37` flags `<sup>` unported) and draws runs
in `renderer-box.ts` (`renderStateTextLines`, `:150-200`, ONE font size per
line today) and `renderer-composite-box.ts`; notes are sized by
`state-note-layout.ts` and drawn by state's `renderer-note.ts` (SI29 T7 —
table rows drawn as space-joined cells; do not regress T4/T7 of SI29).
`juvagu-33-dupa212` carries `\t<sup>1</sup>` in a description (SI29's ruled
grown row: 83.57 px) and `<sub>`/`<sup>` in notes; the harness row is
`s1 width idx1`, plus a −1.0 px `s1 height idx1` row expected to close with
the Sea line height. Read `decisions.md` D2/D3/D7, T3's journal row (run
shape), `planning/sizer-renderer-parity.md`, CLAUDE.md.

## Task
1. `state-sizing-creole.ts`: `StateTextRun` gains `size` and `dy` from the
   seam's runs; line heights from the seam; remove the `:33-37` flag.
2. `renderer-box.ts`/`renderer-composite-box.ts`: per-run `font-size` + `dy`
   on the tspans (this also fixes per-run `<size:N>` drawing — journal it);
   the y advance per line uses the seam's line height.
3. Notes: `state-note-layout.ts` + `renderer-note.ts` draw the same runs
   (size/dy).
4. Ratchets: juvagu-33 entry removed (or tightened to whatever residual has
   a cited mechanism — the tab-stop term is already jar-exact); state fixture
   entry removed. Run the parity audit checklist.
TDD: `tests/unit/state/state-sizing-creole.test.ts` paired cases (juvagu's
line, nested size/sup, note `<sub>`).

## Write-set
As in the batch overview. `state-geo-types.ts` is NOT in it — if the run type
there must change, STOP and report (SI29 T4 precedent).

## Read-set
T3 journal row; the five files above; `oracle/goldens/state/juvagu-33-dupa212/`;
`test-results/dot-cache/state/juvagu-33-dupa212/`; Java `AtomText.java:197-233`,
`Sea.java:72-80`.

## Acceptance
- Given juvagu-33, then `s1 width idx1` exact (83.57 → 0) and `s1 height idx1` closes; size-backlog entry removed; `harness-diff.py` reports the rows went exact, 0 grew.
- Given `StateTextRun.size/dy`, when rendered, then tspans carry per-run `font-size` + `dy` and the drawn text equals the measured runs (paired test).
- Given the state fixture (nested size/sup, note `<sub>`), then declared sizes match `svek-N.dot`.
- Given `render-manifest`, then only juvagu-33 and the state fixture move; svg-state goldens rise-only.

## Observability / Rollback
Harness rows; state parity; svg goldens. Reversible.

## Report (≤500 tokens)
juvagu rows before/after; state fixture rows; parity-audit answers; manifest
moves; files.
