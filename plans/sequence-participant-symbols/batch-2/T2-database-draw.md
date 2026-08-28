# T2 — Draw the database head through the seam

## Context

`plantuml-ts` is a faithful port; the Java at `~/git/plantuml` is the spec.
**Open the method body.** Sequence pixels come from `sequencediagram/teoz/`;
`sequencediagram/graphic/` is DEAD.

`renderDatabaseShape` (`renderer-participant-shapes.ts:209-212`) composes
`renderDatabaseBody` + `renderDatabaseCap` + `renderDatabaseArc` — a
hand-rolled cylinder of `rect + line + line + ellipse`. Upstream draws two
`UPath`s (`USymbolDatabase.java:62-79`). T1 built the faithful seam.

Read `../README.md` and `../decisions.md` first; D1 and D2 govern.

## Task

1. Replace `renderDatabaseShape`'s body with a call to T1's
   `renderParticipantSymbol('database', …)`.
2. Delete `renderDatabaseBody` (`:176`), `renderDatabaseCap` (`:191`),
   `renderDatabaseArc` (`:202`) and `computeDatabaseGeo` (`:147`) plus the
   now-unused `DatabaseGeo` type — **first grep for other references**;
   "looks unused" is not "is unused".
3. `renderer.ts:145-149` (head) and `:177-181` (footer) call
   `renderDatabaseShape`. Keep those call sites; pass the correct `head`
   boolean so the glyph/text order flips as
   `ComponentRoseDatabase.java:81-87` does.

Do NOT change sizing — that is T3, running in parallel on
`sequence-layout-participants.ts`. Do NOT touch `actor` (D4, T6).

## Write-set (exhaustive)

- `src/diagrams/sequence/renderer-participant-shapes.ts`
- `src/diagrams/sequence/renderer.ts`
- `tests/unit/sequence/renderer.test.ts`

## Read-set

- `src/diagrams/sequence/renderer-participant-shapes.ts:129-212`
- `src/diagrams/sequence/renderer.ts:137-185` — the head/footer dispatch
- `src/diagrams/sequence/renderer-participant-symbol.ts` — T1's contract
- `~/git/plantuml/.../skin/rose/ComponentRoseDatabase.java:75-89`

## Interface contract

Consumes T1's `renderParticipantSymbol`. Produces the SVG for a `database`
head/tail. No new exports.

## Acceptance criteria

- Given a `database` participant, when the head is rendered, then the output
  contains **two `<path>` elements and no `<ellipse>`**, matching
  `USymbolDatabase.java:62-79`.
- Given a `database` participant with a footer box, then the tail renders with
  `head: false` and the text sits above the glyph
  (`ComponentRoseDatabase.java:84-87`).
- Given a diagram with no `database` participant, then output is
  byte-identical to before this task.
- Given `grep -rn "renderDatabaseBody\|renderDatabaseCap\|renderDatabaseArc"
  src`, then there are no remaining references.
- 90/90/90 on the changed lines.

## Observability

This task moves rendered output on 34 corpus fixtures. Do NOT run the
adjudicator yourself — the orchestrator runs it at the batch gate. **Never
read a raw `diffCount` as fidelity**: `compareNodes` short-circuits and
charges `units(actual) + units(expected)`, which grows as our document grows.

## Rollback

**Reversible.** Renderer-only; reverting restores the prior output exactly.

## Quality bar

The four gates exit 0. `renderer.ts` must stay **under 500 lines** — the
complexity hook blocks the write otherwise. No Prettier.

`npm test` is RED at baseline with exactly three sequence-ratchet failures.
Never re-pin a baseline JSON.

## Commit

`feat(T2): draw the sequence database head through USymbolDatabase`
