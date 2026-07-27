# T1 — Wire creole-HR rendering (the crux)

## Context
plantuml-ts is a faithful Java→TS port of PlantUML (pure SVG, no DOM). A
description leaf node's multi-line body, once it carries a creole horizontal
rule (`----`/`====`/`____`), produces a `UHorizontalLine` shape that currently
crashes the measurement/render pass `LimitFinder` with
`LimitFinder.draw: unsupported shape UHorizontalLine`. `UHorizontalLine` is an
*infinite, stencil-clipped* rule — it must be intercepted by
`AbstractUGraphicHorizontalLine` (which supplies the enclosing box's x-extent
via a `UGraphicStencil`) and converted to concrete draws BEFORE reaching the
base graphic. Both classes are already ported. See `decisions.md` ADR-1.

## Task
Wire the existing `AbstractUGraphicHorizontalLine`/`UGraphicStencil` interception
into the description node-body creole render path so a `UHorizontalLine` is drawn
as a rule (using the box width) instead of reaching `LimitFinder` raw. This must
be **output-neutral for every current fixture** — today no `[ … ]` body reaches
the renderer, so no existing SVG changes; T1 only adds the capability.

## Read-set
- `src/core/klimt/drawing/AbstractUGraphicHorizontalLine.ts` — the interceptor
  (how it wraps a UGraphic and converts `UHorizontalLine` → draws).
- `src/core/klimt/drawing/UGraphicStencil.ts` — supplies start/end X.
- `src/core/klimt/shape/UHorizontalLine.ts` — the shape + its `drawMe`/`drawHLine`.
- `src/core/decoration/symbol/USymbolNode.ts#drawHline` — an existing call site
  that already draws a `UHorizontalLine` (mirror how it wraps the graphic).
- `src/core/klimt/drawing/LimitFinder.ts` — confirm the throw site; DO NOT add a
  branch here (ADR-1).
- `src/diagrams/description/renderer-cluster.ts` — the description node renderer;
  trace how a leaf node's label/body is drawn (the creole text block).

## Write-set
- `src/diagrams/description/renderer-cluster.ts` (and the specific leaf-label
  draw helper it calls — keep the edit within the description render path).

## Architecture (locked)
ADR-1: interception, not a `LimitFinder` branch. Mirror `USymbolNode.drawHline`'s
wrapping. If the fix appears to need editing `LimitFinder`'s dispatch, STOP and
log — the wiring is at the wrong layer.

## Quality bar
`npm run typecheck` clean; `npm test` green. Critically: render a probe with a
`node n [\nfoo1\n====\nfoo2\n]` body and confirm **no error diagram**
(`expectNoErrorDiagram`), and confirm an existing description golden (no HR)
renders byte-identically (diff its SVG before/after).

## Acceptance criteria
- Given a node whose body contains `====`/`----`, when rendered, then no
  PlantUML error diagram is produced (the HR draws via the stencil interceptor).
- Given a description fixture with no HR body, when rendered, then its SVG is
  byte-identical to `main` (output-neutral).

## Commit
`feat(description): render creole horizontal rules in node bodies via the
stencil interceptor (S1L-b T1)` — one commit.
