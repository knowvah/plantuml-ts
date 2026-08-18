# T7 — F2: note bodies through the creole seam (G2)

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch `fix/state-declared-size`.
SI28 `findings/note.md` (fatupo-62, xeziki-47#a): `measureNote`
(`src/diagrams/state/state-note-layout.ts:84-93`) sizes each raw source line
literally — pipe-table rows and `<color:…>` included — where the jar builds
the body through `BodyFactory.create3` (`EntityImageNote.java:114-118`,
`StripeTable.java:82-84`, `AtomTable.java:90-96`).
`state-composite-edge-label.ts` carries a byte-identical duplicate of the
body sizing (SI28 G2 write-set) — move it in lockstep or make it call the
same function. T1's seam gives styled runs and `kind:'table-row'`; T1's report
in `decision-journal.md` names the exports. `decisions.md` D1/D5/D8 locked.

## Task
1. Size note bodies via the seam (text lines + table rows: use the port's
   `klimt/creole/legacy/StripeTable.ts`/`AtomTable` model for row widths — cite
   `AtomTable.java` lines); keep the note margins as they are (already
   jar-verified per the record).
2. `renderer-note.ts`: draw the same runs/rows (compare with how class's
   `renderer-note.ts` renders — read only, do not import).
3. Ratchets for fatupo-62/xeziki-47; pre-run `render-manifest --diff` and
   list every note-bearing fixture that moves, confirming jar-ward.
TDD: extend `tests/unit/state/state-note-layout.test.ts` with fatupo/xeziki
`in.puml`, paired measure/render assertions.

## Write-set
`src/diagrams/state/state-note-layout.ts`, `state-composite-edge-label.ts`,
`renderer-note.ts`, `tests/unit/state/state-note-layout.test.ts`, ratchet
entries.

## Read-set
`findings/note.md` (fatupo, xeziki#a records); `state-note-layout.ts` (whole);
`state-composite-edge-label.ts` (the duplicated sizing block);
`renderer-note.ts` (whole); `src/core/klimt/creole/legacy/StripeTable.ts`;
`src/diagrams/class/note-layout-measure-rows.ts:1-120`, `class/renderer-note.ts:300-360`
(reference only); Java `EntityImageNote.java:90-140`, `klimt/creole/legacy/
StripeTable.java`, `atom/AtomTable.java:60-120`.

## Acceptance
- Given a note with `|= a | b |` rows or `<color:red>` markup, then measured per the cited Java model and rendered with the same runs.
- Given fatupo-62 and xeziki-47 (#a rows), then harness rows exact; `harness-diff.py` clean.
- Given `render-manifest --diff`, then every moved fixture is note-bearing and jar-ward (listed).

## Observability / Rollback
Harness rows; svg-conformance ratchet. Reversible.

## Report (≤500 tokens)
Rows per fixture; the duplicate in `state-composite-edge-label.ts` — merged or
kept in lockstep (which, why); manifest moves.
