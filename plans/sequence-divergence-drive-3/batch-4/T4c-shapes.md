# T4c — SAX shape handlers

Agent: `typescript-pro` (sonnet), worktree `sdd3-T4c`. Commit:
`feat(sprite): port SvgSaxParser shape handlers`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism
`RenderHandler` shape methods, `SvgSaxParser.java:487-627`. Each reads
geometry with `getDoubleAttr` (`:1321-1335`, default on missing/NaN), takes
`elementUgs = applyStyleAndTransform(attrs, ugs)` (`:1094`), then draws:
`handleRect` `:487-505` (`URectangle`, `rx`/`ry` rounding), `handleCircle`
`:506-517` and `handleEllipse` `:518-530` (both through `buildEllipsePath`
`:606-617`, a `UPath` of four arcs, not `UEllipse`), `handleLine` `:531-546`,
`handlePolyline` `:547-550` / `handlePolygon` `:551-554` ->
`handlePolyShape(attrs, closed)` `:555-605` (number scan with the
`numMatcher`, pairs consumed `i + 1 < size`, `closePath` only when closed),
`handlePath` `:618-627` (path data parsed by the existing `SvgPath`,
`src/core/klimt/sprite/SvgPath.ts`). Verify against the Java how `fill`
defaults and `stroke="none"` are decided (in `applyStyleAndTransform`, T4e)
vs. here; quote the line for every constant. Shapes drawn with fill none and
no stroke must still be emitted exactly as upstream emits them.

## Targets
Visible at T4f (rows with rect/circle/ellipse/line/poly/path in their sprite,
e.g. bugafa-93-duzi514, vivava-25-vuba802). Unit-tested here against the
Java and golden `in.svg` shapes.

## Write-set
`src/core/klimt/sprite/sax/sax-shapes.ts` (replaces T4b's stub; keep the
exported signatures),
`tests/unit/core/klimt/sprite/sax/sax-shapes.test.ts`.

## Read-set
`SvgSaxParser.java:487-627,1321-1335`; `sax-context.ts`, `sax-style.ts` stub
signatures (T4b); `SvgPath.ts`; `UGraphicWithScale.ts` public methods;
`svg-nanoparser-shapes.ts` (what nano already does for the same shapes —
read to learn the existing `UPath`/`URectangle` builders; do NOT reuse nano
branching, the SAX shapes differ).

## Interface contracts
Exports exactly: `handleRect|handleCircle|handleEllipse|handleLine|
handlePolyline|handlePolygon|handlePath(ctx: RenderContext, attrs:
SaxAttributes): void`. Calls `applyStyleAndTransform`/`getDoubleAttr` from
`./sax-style.js`; tests `vi.mock('./sax-style.js')` (T4e owns the real one).
Draws through `ctx.ugs` only; never reassigns `ctx.ugs`.

## Acceptance
- Given `<rect x="1" y="2" width="3" height="4" rx="1"/>`, then one rect
  primitive with those values at `UTranslate(1, 2)` (expected values cite
  `:487-505`).
- Given `<circle cx="5" cy="5" r="3"/>`, then a path equal to
  `buildEllipsePath(5, 5, 3, 3)` (`:606-617`).
- Given `<polygon points="0,0 4,0 4,4"/>` and the same with `polyline`, then
  the first is closed, the second open; an odd trailing number is ignored.
- Given the 1042 pins, then all stay byte-equal; no conformant loss in any
  engine (module is unreachable until T4f).

## Observability
N/A.

## Rollback
Reversible.
