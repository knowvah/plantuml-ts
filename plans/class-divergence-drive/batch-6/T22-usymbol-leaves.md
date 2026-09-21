# T22 — USymbol leaves in class

**Agent:** typescript-pro (sonnet) · **Depends on:** T18 (nominal —
layout work, not Paint). Parallel with T19/T20/T21/T23. Moves layout
(node sizes) for the fixtures it touches.

## Context

Two related gaps: (1) `() "Name"`/`circle X` (`LeafType.CIRCLE`) should
draw the interface "eye" — an 8px ellipse plus a label below it (2
children) via `EntityImageDescription`/`USymbols.INTERFACE`
(`svek/GeneralImageBuilder.java:157-158`, `abel/Entity.java:415`) — but
this port's `layout.ts`/`renderer-classifier-box.ts` treat `circle` as an
ordinary classifier box (rect + badge ellipse + badge path + text + 2
lines = 6), even though `class-command-containers.ts:139-146` already
sets `kind = 'circle'` correctly and `src/core/decoration/symbol/
USymbolInterface.ts` exists unused (A2b E8). (2) `cacoma-43-poxu615`'s
`allow_mixing` mixes `usecase`/`actor`/`component` leaves into a class
diagram; upstream dispatches each by `LeafType`/`USymbol` in
`GeneralImageBuilder#createEntityImageBlock` to the same description-leaf
sizing/drawing this port already has in core, but the class engine has
no route to it. The report is a lead: re-read the cited bodies before
editing.

## Task

1. Tests first: `conija-14-nuta580`/`niduni-65-bujo175` (circle → 8px
   ellipse + label) and `cacoma-43-poxu615` (usecase/actor/component
   leaves each drawing their own description shape).
2. E8: route `kind === 'circle'` in `class-layout-leaf-shapes.ts`/
   `layout.ts` to the existing description-engine sizing (16×16 node +
   label, mirroring `USymbolInterface`'s shape) instead of the ordinary
   classifier box path; route the render side the same way in
   `renderer-usymbol-entity.ts` (already exists — confirm it is reachable
   from the class engine's leaf-render dispatch, wire it in if not).
3. cacoma: find upstream's `LeafType`/`USymbol` dispatch in
   `GeneralImageBuilder#createEntityImageBlock` and this port's
   equivalent leaf-kind dispatch (`class-layout-leaf-shapes.ts`); add the
   `usecase`/`actor`/`component` kinds, routing each to the
   already-ported description-leaf sizing/drawing in core (do not
   reimplement ellipse/stick-figure/component shapes — they exist).
   `allow_mixing` itself is already parsed elsewhere; this task only
   needs the leaf-kind dispatch, not the mixing grammar.
4. `.agent-notes/cdd-T22.md`: which dispatch point in
   `class-layout-leaf-shapes.ts` the circle/usecase/actor/component
   kinds were added to, and whether `renderer-usymbol-entity.ts` needed
   new wiring or was already reachable.

## Read-set

`src/diagrams/class/class-command-containers.ts:139-146`;
`src/diagrams/class/class-layout-leaf-shapes.ts` (whole, 144 lines);
`src/diagrams/class/renderer-usymbol-entity.ts` (whole, 155 lines);
`src/diagrams/class/layout.ts` (leaf-kind dispatch section);
`src/core/decoration/symbol/USymbolInterface.ts`;
`src/core/decoration/symbol/USymbolUsecase.ts`,
`USymbolActor.ts`, `USymbolComponent1.ts`/`USymbolComponent2.ts`. Java:
`svek/GeneralImageBuilder.java:157-158` (`LeafType.CIRCLE` dispatch),
`createEntityImageBlock` (`LeafType`/`USymbol` switch — locate via
grep); `abel/Entity.java:415` (`getUSymbol`). Diagnosis:
`diagnosis/A2b-entity-groups.md` E8; `cacoma allow_mixing` note in
`fixtures.md`.

## Write-set

`src/diagrams/class/class-layout-leaf-shapes.ts`,
`src/diagrams/class/renderer-usymbol-entity.ts`,
`src/diagrams/class/layout.ts`, their `*.test.ts` files,
`.agent-notes/cdd-T22.md`, `decision-journal.md` (append-only).

## Acceptance criteria

- Given `conija-14-nuta580` and `niduni-65-bujo175`, when rendered, then
  each draws an 8px ellipse plus a label below it, matching the jar's
  child count and shape exactly
- Given `cacoma-43-poxu615`, when rendered, then the `usecase`, `actor`,
  and `component` leaves each draw their own description shape (ellipse
  `rx/ry` ~2.5-scaled per the jar, stick-figure, component icon) instead
  of a classifier box
- Given every other class fixture with no `circle`/mixed-leaf syntax,
  when re-rendered, then output is unchanged

## Observability

N/A — no new observable operations.

## Rollback

Reversible — revert the task's commits; pins are committed with the code.

## Quality bar

Four gates green. `npx tsx tools/render-diff.mts conija-14-nuta580
niduni-65-bujo175 cacoma-43-poxu615` before/after — expect a structural
change (layout move) with the after-state matching the jar's DOT node
sizes for the three fixtures; confirm no OTHER fixture's node sizes
moved. Files ≤500 lines, functions ≤30 NLOC, CCN ≤10, ≤5 params.

## Boundaries

Always: reuse the existing description-engine leaf sizing/drawing and
`USymbol*` shape modules — never hand-roll a second ellipse/stick-figure/
component renderer. Ask first: any stop condition in `../README.md`.
Never: touch the `allow_mixing` grammar/parser (out of scope — leaf-kind
dispatch only); edit files outside the write-set (stop 1); fit a value.

## Commit

`feat(cdd-T22): route circle/allow_mixing leaves through USymbol shapes`

Body: why — `kind === 'circle'` and the three `allow_mixing` leaf kinds
were already classified correctly at parse time but had no render/layout
dispatch to the existing description-engine shapes; this wires the
dispatch without adding new shape code.
