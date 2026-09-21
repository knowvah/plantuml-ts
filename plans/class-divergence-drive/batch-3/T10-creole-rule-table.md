# T10 — creole `----` rule and tables in notes/labels

**Agent:** typescript-pro (sonnet) · **Depends on:** T8 (parallel with T9 — disjoint write-sets)

## Context

A `----`/`--` line inside a note, legend, or edge label draws as a `<line>`
upstream; this port swallows it (E13, MEDIUM-HIGH confidence — the Java
`AtomHorizontalTexts`/`StripeSimple` line branch has not been read, only
both sides' rendered output compared). Separately, `jovigo-38-tuni063`'s
note holds a creole table the port has never diagnosed at the mechanism
level (a hand attribution only, in `fixtures.md`) — instrument it here.
`renderer-note.ts` is T8's write-set; this task must NOT edit it, so it
owns a new small emitter, `renderer-note-lines.ts`, that consumes T8's
exported `renderPlainNote` builder only through that new file. Mechanism:
`diagnosis/A2b-entity-groups.md` E13; `fixtures.md`'s `ponono`/`sumocu`
rows (off-by-one in a long note's empty-vs-filled `<text>` sequence —
diagnose with an artifact per diagnosis mode, don't guess the fix).

## Task

1. Tests first: a note/legend/link-label containing a `----` line; a note
   containing a creole table (`jovigo-38-tuni063`'s shape).
2. Read `net/sourceforge/plantuml/klimt/creole/atom/
   AtomHorizontalTexts.java`, the `StripeSimple.java` line branch (not read
   by the diagnosis — genuinely new ground), and `klimt/creole/legacy/
   StripeTable.java`; journal what triggers a `<line>` emission vs. a table
   row.
3. Add `----` stripe support under `src/core/klimt/creole/` (or wire an
   existing-but-unused atom if `get_symbols_overview` finds one — check
   before adding) that emits a `<line>`; call it from the new
   `renderer-note-lines.ts`, which `renderer-note.ts` (T8's file) invokes
   for its line content instead of dropping `----` lines.
4. For `jovigo-38-tuni063`: instrument (`render-diff.mts`) the note's child
   sequence against the jar's 17 children; state the table mechanism with
   `file:line` before implementing it — the symptom (missing children)
   against a stated reference is an observed discrepancy, so this is
   diagnosis mode, not greenfield.
5. For `ponono-25-fevo574`/`sumocu-27-vubo674`: instrument the alternating
   `text[N] 0→1`/`text[N+1] 1→0` pattern (dump both `<text>` runs for the
   long note) and either fix the off-by-one with a stated mechanism or file
   it in `planning/next-missions.md` with the diagnosis artifact — do not
   guess a fix without the artifact.
6. `.agent-notes/cdd-T10.md`: the `AtomHorizontalTexts`/`StripeTable`
   trigger conditions found in step 2, for the B7 creole batch to reuse.

## Read-set

`net/sourceforge/plantuml/klimt/creole/atom/AtomHorizontalTexts.java`
(whole); `net/sourceforge/plantuml/klimt/creole/legacy/StripeSimple.java`
(the horizontal-rule branch — locate via its atom-construction site);
`klimt/creole/legacy/StripeTable.java` (whole); `src/core/klimt/creole/`
(`get_symbols_overview` first — find the existing atom dispatch before
adding a file); `src/diagrams/class/renderer-note.ts` (post-T8, read-only —
this task calls it, never edits it).

## Write-set

`src/core/klimt/creole/` (new stripe file(s) for `----` and/or table,
named after what step 2/3 finds), `src/diagrams/class/
renderer-note-lines.ts` (new), their `.test.ts` files,
`.agent-notes/cdd-T10.md`, `planning/next-missions.md` (append-only, only
if `ponono`/`sumocu` are filed rather than fixed),
`plans/class-divergence-drive/decision-journal.md` (append-only).

## Interface in (from T8)

`renderPlainNote(...) => { entityParts: string[]; connector?: string }` —
read-only; this task's new emitter feeds INTO `entityParts`, it does not
change `renderPlainNote`'s signature. If the interface must change, that
is stop condition 1 — halt and coordinate rather than editing T8's file.

## Acceptance criteria

- Given `sodizo-26-salo123`, when rendered, then the note holds the jar's
  `<line>` elements (16-child structure, not 14)
- Given `jovigo-38-tuni063`, when rendered, then the note group has 17
  children matching the jar's table structure
- Given `ponono-25-fevo574`/`sumocu-27-vubo674`, then either both are fixed
  with a stated mechanism, or both carry a `planning/next-missions.md`
  entry with the diagnosis artifact (mechanism, origin, causal chain, ruled
  out) — "looks hard" is not a stop condition

## Observability

N/A — no new observable operation.

## Rollback

Reversible — revert the task's commits; pins are committed with the code.

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all green.
`render-diff.mts` on `sodizo-26-salo123`, `xicipi-57-bibe032`,
`gujigi-63-roki030`, `kacico-91-bati232`, `fomofi-36-lova857`,
`jovigo-38-tuni063`, `ponono-25-fevo574`, `sumocu-27-vubo674` before/after.

## Boundaries

Always: instrument before stating the `jovigo`/`ponono`/`sumocu`
mechanisms — no fix before a stated mechanism. Ask first: any stop
condition in `../README.md`; touching `renderer-note.ts` itself (not in
this write-set — if the fix genuinely requires editing it, halt and
coordinate with T8/T9 rather than editing it here). Never: edit
`note-layout-groups.ts`/`renderer.ts` (T9's write-set).

## Commit

`feat(cdd-T10): creole horizontal rule and table in notes/labels`

Body: cites the `AtomHorizontalTexts`/`StripeTable` bodies read in step 2;
states whether `ponono`/`sumocu` were fixed or filed, with the artifact.
