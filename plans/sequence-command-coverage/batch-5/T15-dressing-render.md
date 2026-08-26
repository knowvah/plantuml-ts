# T15 — Render the decorated dressing

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical spec. T12 parses `o`/`x` decorations, `/`/`\`
half-heads and inclination into the `ArrowConfiguration` T6 declared. This port
already has a **faithful** arrowhead model — `ArrowHeadKind`, `ArrowPart`,
`ArrowDecoration`, `DIAM_CIRCLE`, `THIN_CIRCLE`, `SPACE_CROSS_X`, the polygon
and async-line builders — at `sequence-arrowhead.ts:49-380`. Its own header
notes CROSSX, TOP_PART and BOTTOM_PART were unreachable because the old flat
`MessageStyle` could not express them.

They are reachable now. This task draws them.

## Task

Render every dressing form T12 can produce:

- `ArrowDecoration.CIRCLE` on either side — the circle an `o` draws, at the
  offsets `CIRCLE_REVERSE_SIDE` / `CIRCLE_NORMAL_SIDE` already encode.
- `ArrowHeadKind.CROSSX` — the cross an `x` draws.
- `ArrowPart.TOP_PART` / `BOTTOM_PART` — the half-heads from `/` and `\`.
- `inclination` — `ArrowConfiguration#withInclination`, which
  `sequence-arrowhead.ts:28` records as having had no parser producing it.

Verify each against the jar before pinning any offset. Where the existing
constants already carry a citation, trust the citation and the code, not a
measurement — and **never adjust a constant to shrink a diff**.

## Write-set

- `src/diagrams/sequence/sequence-arrowhead.ts`
- `src/diagrams/sequence/renderer-arrowhead.ts`
- `tests/unit/sequence/sequence-arrowhead.test.ts`

Not `renderer-message.ts` (T16 owns it this batch), not `ast.ts`, not
`docs/catalog.md`.

## Read-set

- `~/git/plantuml/.../skin/rose/ComponentRoseArrow.java` — `diamCircle`, the
  circle and cross drawing
- `.../skin/ArrowConfiguration.java` — including `withInclination`
- `.../skin/ArrowHead.java:38-40`, `ArrowPart.java:38-40`,
  `ArrowDecoration.java:38-40`
- `src/diagrams/sequence/sequence-arrowhead.ts` — whole file; its header
  documents exactly which members were unreachable and why
- `src/diagrams/sequence/renderer-arrowhead.ts:410-470`

## Note on file size

`sequence-arrowhead.ts` was at 497 lines against the 500-line cap before T6
removed `arrowConfigurationFor` and its tables. Check the headroom you actually
have before adding; if it is thin, split the module rather than compressing
code to fit. The complexity hook is a directional ratchet — it blocks growth
past the cap, and it will block this task mid-flight otherwise.

## Architecture decisions in force

D1 (locked): the whole point of replacing the flat enum was to make these
members reachable. If some dressing form still cannot be expressed, that is a
signal the T6 model is wrong — journal it rather than adding a special case in
the renderer.

## Interface contracts

Consumes T6's `ArrowConfiguration` and T12's populated decorations. Produces no
new interface; T17 reuses these drawing functions for exo arrows.

## Acceptance criteria

- Given a config with `decoration2: 'CIRCLE'`, when rendered, then a circle is
  drawn at the head at the offsets the existing constants specify.
- Given `head: 'CROSSX'`, then a cross is drawn.
- Given `part: 'TOP_PART'` and `'BOTTOM_PART'`, then each draws its half of the
  polygon, and the two differ.
- Given a config with `inclination`, then the arrow is slanted by it.
- Given the corpus, then no already-`baseline` fixture rises without a T4
  verdict, and the ~20 dressing fixtures move toward their goldens.

## Observability

N/A beyond the gates. Report falls via `[IMPROVED]`, read with
`--reporter=verbose`.

## Rollback

**Reversible.** Two render modules.

## Quality bar

All four gates green; 90/90/90. Verify against the jar with
`scripts/oracle-render.sh <out-dir> <puml>`, never a hand-typed `java -jar` —
without `-DPLANTUML_DETERMINISTIC_TEXT=true` every text-derived number measures
the flag rather than the port.

## Boundaries

- **Always**: cite `file:line` for every offset and constant.
- **Never fit a value** — keeping whatever shrank the error is forbidden
  *especially* when it shrinks. Never edit `renderer-message.ts` or `ast.ts`.
- **Ask first**: if `sequence-arrowhead.ts` cannot take the addition under the
  line cap, journal the proposed split before making it.

## Commit

`feat(T15): draw circle, cross, half-head and inclined arrow dressings`
