# T14 — Exo arrow layout: border-anchored geometry

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical spec. T13 parses exo arrows into
`MessageExoEvent`. Nothing places them yet.

An exo arrow is unlike every other message: one end sits on the **diagram
border**, not on a lifeline. A `TO_RIGHT` exo therefore **participates in the
diagram's width** — `MessageExoArrow#getRightEndInternal` takes
`Math.max(maxX, …)`. Getting this wrong changes the document's dimensions, not
just one arrow.

## Task

Create `sequence-layout-exo.ts` porting `MessageExoArrow`'s geometry
(`graphic/MessageExoArrow.java:84-140`):

- `getLeftStartInternal` — for `FROM_LEFT`/`TO_LEFT`: if `shortArrow`, the
  participant's live-thickness `pos2` minus `getPreferredWidth`; else `0`,
  **or `ComponentRoseArrow.diamCircle`** when the matching side carries an
  `ArrowDecoration.CIRCLE` (note the asymmetry: `decoration1` for `FROM_LEFT`,
  `decoration2` for `TO_LEFT`). For right-border types, the participant's
  live-thickness `pos2`.
- `getRightEndInternal` — for left-border types, the participant's
  live-thickness `pos1`; for right-border types, `Math.max(maxX, left +
  preferredWidth)`, **minus `diamCircle`** for a CIRCLE on the matching side.
- `getActualWidth` = right − left.

Add the `messageExo` arm to the layout dispatch in
`sequence-layout-events.ts` (T2 left room for it). Thread the exo x-extent into
`layout.ts`'s diagram-width computation.

`MessageExo.overrideNotePosition` flips note position (left-border exo ⇒ note
RIGHT, and vice versa) — port it if a note can attach to an exo message in this
port's model; if it cannot, journal that reading rather than guessing.

This task is **layout only**. T17 renders.

## Write-set

- `src/diagrams/sequence/sequence-layout-exo.ts` (new)
- `src/diagrams/sequence/sequence-layout-events.ts` — the dispatch arm
- `src/diagrams/sequence/layout.ts` — width participation
- `tests/unit/sequence/sequence-layout-exo.test.ts` (new)

Not `sequence-layout-message.ts`, not `ast.ts`, not any renderer, not
`docs/catalog.md`.

## Read-set

- `~/git/plantuml/.../sequencediagram/graphic/MessageExoArrow.java:60-200` —
  **whole class**. Read `getLeftStartInternal` and `getRightEndInternal`
  method bodies; the `diamCircle` insets are asymmetric per type and cannot be
  inferred.
- `.../sequencediagram/MessageExo.java:64-80` — `overrideNotePosition`
- `.../sequencediagram/MessageExoType.java:38-78` — `getDirection`,
  `isLeftBorder`, `isRightBorder`
- `.../skin/rose/ComponentRoseArrow.java` — `diamCircle`
- `src/diagrams/sequence/sequence-layout-events.ts` — the dispatch shape
- `src/diagrams/sequence/layout.ts` — where diagram width is computed
- `src/diagrams/sequence/sequence-arrowhead.ts:123-160` — this port's
  `DIAM_CIRCLE` and friends, already ported with citations
- `../diagrams/data-flow.md`

## Architecture decisions in force

D3 (locked): `MessageExoEvent` is its own kind. `MessageExo.isSelfMessage()`
returns **false** despite participant1 == participant2 — do not route exo
messages through any self-message path.

## Interface contracts

Consumes T6's `MessageExoEvent` and T13's populated fields. Produces a
`MessageGeo`-shaped result carrying border-anchored `x` plus the exo type, for
T17.

## Acceptance criteria

- Given a `FROM_LEFT` exo with no decoration and `shortArrow` false, when laid
  out, then its left x is `0`.
- Given the same with an `ArrowDecoration.CIRCLE` on the matching side, then
  its left x is `diamCircle` — cite the line that says which decoration index
  matches which type.
- Given a `TO_RIGHT` exo, then the diagram's width grows to accommodate it
  (`Math.max(maxX, …)`), and a document with only that exo is wider than the
  same document without it.
- Given a `shortArrow` exo, then its width is `getPreferredWidth`, independent
  of `maxX`.
- Given the corpus, then no already-`baseline` fixture rises without a T4
  verdict.

## Observability

N/A beyond the gates.

## Rollback

**Reversible.** New layout module plus two edits.

## Quality bar

All four gates green; 90/90/90. This module is unit-testable against
hand-constructed `MessageExoEvent` literals — that testability is the payoff of
D3, so use it rather than testing only end-to-end.

## Boundaries

- **Always**: read the Java method bodies; cite `file:line` for every constant
  and every asymmetric decoration index.
- **Never**: fit a coordinate to a golden; never route exo through a
  self-message path; never edit `ast.ts` or a renderer.
- **Ask first**: if `overrideNotePosition` has no counterpart in this port's
  note model, journal the reading instead of inventing one.

## Commit

`feat(T14): port MessageExoArrow border-anchored layout`
