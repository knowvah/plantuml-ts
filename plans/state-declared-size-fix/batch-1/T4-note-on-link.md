# T4 — F5: `note on link` inside a composite (G12)

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch `fix/state-declared-size`.
SI28 `findings/note.md` → `tumaba-64-tosu281`: `transitionLabelText`
(`src/diagrams/state/state-dot-graph.ts:114-120`) reads `t.label`/`t.guard`/
`t.action` but never `t.linkNote`, so `attachTransitionLabel`
(`state-transition-label.ts:200-201`) returns `undefined`, the note is not
drawn, and `addTransitionInk`'s label fold (`layout-ink-extent.ts:386-394`)
never reserves its space; jar folds a note-on-link through the SAME path as
an inline label (`SvekEdge.java:741-747`, `hasNoteLabelText()` → `labelXY`).
The label BOX size is already right (`labelWidth:48,labelHeight:33` ==
jar's `svek-1.dot`). Read that record, `decisions.md`, CLAUDE.md, and
`src/core/svek/image/EntityImageNoteLink.ts` (SI27 T6 shared note-link dim).

## Task
Thread `linkNote` into `transitionLabelText`/`attachTransitionLabel` so the
edge gets a `TransitionGeo.label` (mirroring `SvekEdge.java:741-747`), make the
note-on-link render (find where class/description draw `EntityImageNoteLink`
and mirror; name the file you touch), and tighten tumaba-64's ratchet entry.
Do not touch `layout-ink-extent.ts` (T9/T11 own it) — if the fold needs a
change there, STOP and journal. TDD: extend
`tests/unit/state/state-note-attached-dot.test.ts` with tumaba's `in.puml`.

## Write-set
`src/diagrams/state/state-dot-graph.ts`, `state-transition-label.ts`, ONE
renderer file for the note-on-link drawing (`renderer-note.ts` or
`state-renderer-transitions.ts` — your call, journal it),
`tests/unit/state/state-note-attached-dot.test.ts`, ratchet entry.

## Read-set
`findings/note.md#tumaba-64-tosu281`; `state-dot-graph.ts:100-140`;
`state-transition-label.ts:180-220`; `layout-ink-extent.ts:380-400` (read
only); `src/core/svek/image/EntityImageNoteLink.ts`; Java `svek/SvekEdge.java:
700-760`, `svek/image/EntityImageNoteLink.java`.

## Acceptance
- Given a `note on link` inside a composite, when the DOT graph is built, then the transition carries label text/dims from the note and a `TransitionGeo.label` exists.
- Given tumaba-64, then the note is drawn in our SVG and the harness row is exact.
- Given `render-manifest --diff`, then only tumaba-64 moves.

## Observability / Rollback
Harness row; svg-conformance ratchet. Reversible.

## Report (≤400 tokens)
Files touched, Java lines mirrored, row result, renderer file chosen.
