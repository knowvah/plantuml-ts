# T3 — wire the sequence renderer to the shell and the inline heads

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is canonical. Read the Java method body before writing.

This is the load-bearing task. T1 built the arrow shape vocabulary; T2 opened
the `assembleSvg` route for `diagramType: 'SEQUENCE'`. Both are inert until
this task consumes them. Every sequence fixture's rendered bytes change here.

`assembleDocumentShell` injects **no** marker defs — its own doc comment
(`document-shell.ts:118-121`) records that every klimt-shaped engine draws its
arrowheads as inline polygons or paths, never an SVG `<marker>`. So dropping
the marker references and drawing inline heads is not optional cleanup: it is
what makes the route usable at all. Miss the self-message branch and self
arrows render headless.

## Task

In `src/diagrams/sequence/renderer.ts`:

1. Replace `arrowStyleForMessage` (`:179-198`) — it currently returns
   `markerEnd`/`markerStart` URL references — with a call to T1's
   `arrowConfigurationFor`.
2. Emit inline arrowheads from T1's `HeadGeometry`, translated from tip-local
   to document coordinates, via the shape emitters (`polygon`, `line`,
   `ellipse` from `src/core/svg.js`) — never a template literal, or
   `tests/architecture/svg-emission-seam.test.ts` fails.
3. Cover both branches of `renderMessage` (`:200-240`): the straight-arrow
   branch and the self-message branch (`:211-224`), which uses
   `headGeometrySelf`.
4. Set `diagramType: 'SEQUENCE'` on the `RenderFragment` that `renderSequence`
   returns (`:433`). Do **not** wrap the body in a `<g>` — T2's
   `finalizeSequenceBody` owns that.

Update `tests/unit/sequence/renderer.test.ts`; its assertions at `:126` and
`:134` currently assert marker references and must now assert inline geometry.

## Read-set

- `src/diagrams/sequence/renderer.ts:175-240` — `arrowStyleForMessage`,
  `renderMessage`
- `src/diagrams/sequence/renderer.ts:429-467` — `renderSequence`'s return
- `src/diagrams/sequence/sequence-arrowhead.ts` — T1's whole exported surface
- `src/core/assemble-svg.ts` — T2's `finalizeSequenceBody`
- `src/core/klimt/document-shell.ts:112-170` — what the shell does and does
  not supply
- `~/git/plantuml/.../skin/rose/ComponentRoseArrow.java:84-180` —
  `drawInternalU`: where along the line each dressing is translated to
  (`pos1 = start + 1`, `pos2 = len - 1`), and the `len`/`start` trims each
  head kind applies (`:103-140`)
- `../decisions.md#d2`, `#d3`

## Interface contract

Consumes T1's `arrowConfigurationFor` / `headGeometry*` and T2's
`diagramType: 'SEQUENCE'` dispatch. Produces no new interface.

## Acceptance criteria

1. Given any message of any style, when rendered, then the output SVG
   contains none of the tokens `<marker`, `markerEnd`, `markerStart`
2. Given `style='sync'` with the arrow tip at `(131.231, 66)`, then the
   output contains `<polygon points="121.231,62,131.231,66,121.231,70,125.231,66"`
   — jar `mebidu-16-ruve297`, verified byte-for-byte during planning
3. Given a self-message, then its head is an inline polygon from
   `headGeometrySelf`, not a marker reference
4. Given `renderSequence`'s returned fragment, then `diagramType === 'SEQUENCE'`
   and `body` does not begin with `<g`
5. Given a full fixture rendered through
   `tests/oracle/svg-conformance/render-fixture-sequence.ts`, then the root
   carries all eight shell attributes (`xmlns:xlink`, `version`,
   `data-diagram-type`, `style`, `width`, `height`, `viewBox`, `zoomAndPan`,
   `preserveAspectRatio`, `contentStyleType`) and `<defs/>` is empty

## Quality bar

All four gates green. **`renderer.ts` is 467 lines against the hook's
500-line cap** — the inline-head emission will not fit inside it. Extract the
emission helpers into a sibling module (e.g.
`src/diagrams/sequence/renderer-arrowhead.ts`, mirroring how the class engine
split `renderer-arrowhead.ts` out of its own renderer for exactly this
reason) rather than trying to squeeze them in. Add that file to this task's
write-set in the journal if you create it.

Do **not** re-pin any baseline here. `npm test` will show sequence diff
counts falling; that is expected and is T4's to record. If the ratchet fails
on an *isolated* rise, stop — that is a regression, not progress.

## Observability

N/A — no new observable operations. The measurement surface is the existing
conformance harness, re-pinned in batch 3.

## Rollback

Reversible, but **not independently**: reverting this task without also
reverting T4's and T5's re-pinned artifacts leaves baselines pinned to output
that no longer exists. Revert the batch, not the task.

## Boundaries

- **Always:** route every shape through the emitters in `src/core/svg.js`
- **Never:** re-pin `diff-baseline.json`, `diff-census.json` or
  `render-manifest-baseline.json` in this task; touch layout
  (`sequence-layout-*.ts`), the parser, or the AST; change the 40 px
  self-loop width (Gap SQ-5, out of scope)
- **Ask first:** if faithful head placement turns out to need a geometry
  value the layout stage does not currently carry

## Commit

One commit: `feat(T3): draw sequence arrowheads inline and adopt the shell`
