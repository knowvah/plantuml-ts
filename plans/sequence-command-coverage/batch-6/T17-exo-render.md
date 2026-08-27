# T17 — Draw exo arrows

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical spec. T13 parses exo arrows, T14 places them
with border-anchored geometry. This task draws them — the last link in the
mission's largest feature (**~77 fixtures**).

The dressing drawing functions T15 built are reused here: an exo arrow carries
the same `ArrowConfiguration`, including `o`/`x` decorations on **both** the
border side and the participant side.

## Task

Add the `messageExo` arm to the render dispatch (`renderer.ts:489`'s successor
in `renderer-message.ts`) and draw the arrow from T14's geometry:

- body from `getLeftStartInternal` to `getRightEndInternal`
- head and tail per the `ArrowConfiguration`, reusing T15's drawing functions
- label placement, honouring `MessageExo.overrideNotePosition`'s side flip if
  T14 ported it
- the arrow's own `url` and `lifeColor` if T16's helpers apply

Read `MessageExoArrow#drawInternalU` and `getPreferredHeight`
(`graphic/MessageExoArrow.java:120-200`) before drawing anything.

## Write-set

- `src/diagrams/sequence/renderer-message.ts`
- `src/diagrams/sequence/renderer-arrowhead.ts`
- `tests/unit/sequence/renderer.test.ts`

Not `ast.ts`, not `sequence-arrowhead.ts`, not any layout module, not
`docs/catalog.md`.

## Read-set

- `~/git/plantuml/.../sequencediagram/graphic/MessageExoArrow.java:120-200` —
  **read the method bodies**, especially `drawInternalU` and how the arrow
  component is asked for its dimension at `:174,185`
- `.../skin/rose/ComponentRoseArrow.java`
- `src/diagrams/sequence/sequence-layout-exo.ts` (T14) — the geometry contract
- `src/diagrams/sequence/sequence-arrowhead.ts` (T15) — the drawing functions
  to reuse
- `../diagrams/data-flow.md`

## Note on file size

`renderer-message.ts` was created by T1 specifically to give this task room,
and T16 has since added to it. **Check the headroom before adding.** The
complexity hook blocks growth past 500 lines and will block this task
mid-flight otherwise; split rather than compress.

## Architecture decisions in force

D3 (locked): exo is its own kind. Do not route it through the ordinary message
draw path by coercing `from`/`to` — the discriminated arm exists so the two
paths stay honestly separate.
D6 (locked): these fixtures must **draw**; getting them pixel-exact is the
filed follow-on, not this task.

## Interface contracts

Consumes T14's exo geometry and T15's drawing functions. Produces no new
interface.

## Acceptance criteria

- Given a `FROM_LEFT` exo, when rendered, then the arrow body starts at the
  diagram's left edge and ends at the participant's lifeline.
- Given a `TO_RIGHT` exo, then it ends at the diagram's right edge and the
  document is wider than the same source without it.
- Given an exo with decorations on both sides, then both draw.
- Given the ~77 exo fixtures, then all render — none produces an error page —
  and none rises without a T4 verdict.

## Observability

N/A beyond the gates. Expect many `[IMPROVED]` falls; read them with
`--reporter=verbose`.

## Rollback

**Reversible.** Two render modules.

## Quality bar

All four gates green; 90/90/90. Verify against the jar with
`scripts/oracle-render.sh <out-dir> <puml>`, never a hand-typed `java -jar`.

## Boundaries

- **Always**: read the Java method bodies; cite `file:line`; reuse T15's
  drawing functions rather than writing parallel ones.
- **Never fit a value.** Never coerce exo into the ordinary message path.
  Never edit `ast.ts` or the layout modules.
- **Ask first**: if `renderer-message.ts` cannot take the addition under the
  line cap, journal the proposed split before making it.

## Commit

`feat(T17): draw exo arrows from border-anchored geometry`
