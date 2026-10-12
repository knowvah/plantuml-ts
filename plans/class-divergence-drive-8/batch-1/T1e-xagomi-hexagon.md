# T1e: xagomi — class svek hexagon (re-slotted from T0b, journal row 6)

Prepend [task-preamble.md](task-preamble.md). Agent: typescript-pro (opus).

## Context
T0b re-captured `unknown/xagomi-49-caki729` with `!pragma layout smetana` stripped
(D7). The fixture is a single `hexagon h [ ... ]` leaf, routed CLASS. The jar now
takes the svek path and the row reads render-diff **1/12**, `dotEqual: false`:
- jar `svek-1.dot`: `sh0006 [shape=hexagon,label="",width=2.313889,height=0.916667,...]`;
  ours: `shape=rect` (`npx jiti scripts/dot-sync-report.ts --slug xagomi-49-caki729 unknown`).
- jar `in.svg`: the entity group draws a `<polygon points="182.6,39,140.95,6,57.65,6,16,39,57.65,72,140.95,72,182.6,39">`
  before the four texts; canvas 207×87, text x 57.65. Ours: no polygon, 188×88, text x 48.65.

Upstream mechanism (read it, then quote it):
- `GraphvizImageBuilder.java:214-221`: the single-entity "degenerated" shortcut
  excludes `USymbolHexagon`, so a lone hexagon takes full svek. Our class side already
  mirrors this (`class-geo-builders.ts#degenerateSingleClassifier`).
- `EntityImageDescription.java:127-128`: `USymbols.HEXAGON` → `ShapeType.HEXAGON`;
  `SvekNode.java:337-338` emits `shape=hexagon`. The description engine already maps
  it (`src/diagrams/description/layout-helpers-shape-endpoint.ts:104`); the class
  engine does not.
- `DotStringFactory.java:414-420`: for HEXAGON/OCTAGON, the node position is the
  min of graphviz's polygon points, and `node.setPolygon(minX, minY, points)` stores
  the polygon; `EntityImageDescription.java:307-341` `drawHexagon` draws it.
  The class renderer passes `hexagonPolygon: null`
  (`src/diagrams/class/renderer-usymbol-entity.ts:192-210`, whose comment documents
  this gap).
- The canvas/translate delta (207 vs 188, text +9) must be explained from the Java
  and the dot-engine output, not fitted.

## Task (TDD)
1. Failing tests first: class DOT for a hexagon leaf emits `shape=hexagon`; the
   rendered xagomi entity group contains the jar's polygon points.
2. Emit `shape=hexagon` for class `descriptive` leaves with `usymbol === 'hexagon'`
   (mirror the description mapping; find where class picks a node shape).
3. Obtain the hexagon polygon from the layout result the way upstream reads it from
   graphviz's SVG (`DotStringFactory.java:414-420`). If dot-engine exposes no polygon,
   STOP and report what it does expose (D5/stop 9: no dot-engine edits) before
   deriving points from anything else; derivation from the node box is acceptable only
   if you show graphviz's `shapes.c` hexagon vertex rule produces exactly the jar's
   points (cite `~/git/graphviz/lib/common/shapes.c`).
4. Thread it to `renderer-usymbol-entity.ts` in place of `hexagonPolygon: null`, and
   make the canvas extent follow upstream.

## Write-set
Class DOT shape emission and class layout/geometry files under `src/diagrams/class/`
EXCEPT `class-command-directives.ts`, `ast.ts`, `index.ts` (owned by T1b);
`src/diagrams/class/renderer-usymbol-entity.ts`; their tests under `tests/unit/class/`.
Shared `src/core/` files only as a reported write-set extension (stop and report first
if more than a pure type move). Never `src/diagrams/description/**` (T1c).

## Acceptance
- Given xagomi, then render-diff is 0/0 and the DOT drill-down passes `shapeOk`.
- Given the class ratchet and class DOT parity, then no conformant row is lost.
- Any residual: mechanism with Java + port `file:line`; no fitted value.
