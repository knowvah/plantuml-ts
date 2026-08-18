# T6 — F1: state text through the creole seam (G1 + G8 + G23)

Return only the structured result — no preamble, no trailing summary. Do not
infer unstated requirements; implement the Java as cited; do not spawn subagents.

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch `fix/state-declared-size`.
The mission's centre of mass: 22 of 94 fixtures and every delta above 100 px
except G4's. SI28 `SYNTHESIS.md` §1 G1 (16 fixtures: markup strip 1a,
`wrapWidth` 1b, tab stops 1c), G8 (`<<O-O>>` +10 both axes, 5 fixtures), G23
(composite own-description creole table, kinuca-03) — read those three
sections and every underlying record (`attribute-line.md`,
`creole-sprite-escape.md`, `skinparam-style.md`, `pseudo-state.md#mefici`,
`note.md#xeziki-47#b`, `stereotype.md`, `composite-a.md#kinuca`). T1 built
the seam: read its report (in `decision-journal.md`) and
`src/core/svek/image/creole-text-lines.ts` — you CONSUME it, you do not
re-lex. `decisions.md` D1, D5, D8 are locked; `planning/sizer-renderer-parity.md`
is the audit you must run and note.

## Task
1. `state-sizing.ts`: replace every raw `measurer.measure` on display/
   description/field text (`:176-186`, `:199`, `:207`, `:209-210`) with the
   seam, passing `wrapWidth` (`theme.wrapWidth`, `EntityImageStateCommon.java:
   80-81`/`Style.java:292`) and `tabSize`; add the `<<O-O>>` term
   (`EntityImageState.java:71,74,85,107-112`, `Stereotype.isWithOOSymbol`)
   with the MIN clamps as the Java orders them.
2. `state-composite-sizing.ts:73-74`: composite own-description via the seam
   (kinuca's `|=` table rows).
3. `renderer-box.ts` / `renderer-composite-box.ts`: draw the SAME runs the
   sizer measured (styled tspans/colour/underline; the `[[url]]` label; the
   `<<O-O>>` symbol if the renderer lacks it — check
   `EntityImageState.java` draw path). No raw markup may reach the SVG.
4. Ratchets for all 22 fixtures; pre-run `render-manifest --diff` to list
   every state fixture that moves and confirm each jar-ward (see batch
   overview).
TDD: paired test per symptom (measure X and render X, assert the same
visible text/width) — `tests/unit/state/state-sizing-creole.test.ts`.

## Write-set
`src/diagrams/state/state-sizing.ts`, `state-composite-sizing.ts`,
`renderer-box.ts`, `renderer-composite-box.ts`, new/updated tests under
`tests/unit/state/`, ratchet entries.

## Read-set
Records above; `state-sizing.ts` (whole, 396 lines); `renderer-box.ts`
(whole); `renderer-composite-box.ts` (whole); `state-composite-sizing.ts:60-130`;
`creole-text-lines.ts` (whole); Java `svek/image/EntityImageState.java`
(whole), `EntityImageStateCommon.java:60-120`, `EntityImageStateEmptyDescription.java`,
`Display.java:262-346`, `klimt/creole/atom/AtomText.java:183-275`.

## Acceptance
- Given the 16 G1 fixtures + kinuca-03, then harness rows exact (incl. the 445.200 wrapWidth pair, kubona 373.363, lokija/juvagu tab stops).
- Given `<<O-O>>`, then +10 both axes per `EntityImageState.java:107-112`; dogeji/mosigo/rijoki/viguto/resido rows exact (clamped rows −2.575/−8 close too).
- Given any measured line, when rendered, then the same runs are drawn (paired unit test); the parity audit's checklist is answered in the report.
- Given the svg-conformance state ratchet, then it does not fall; `harness-diff.py` clean; `layering.test.ts` unchanged.

## Observability / Rollback
Harness rows; svg-conformance ratchet; `npm test` wall-clock within ~10 %
(report the number). Reversible.

## Report (≤700 tokens)
Rows exact per fixture; residuals with the row and mechanism; manifest moves
outside the 22 with jar-ward evidence; parity-audit answers; wall-clock.
