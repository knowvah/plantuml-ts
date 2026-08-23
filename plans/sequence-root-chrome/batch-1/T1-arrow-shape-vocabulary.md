# T1 — port the arrow shape vocabulary

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification. Read the Java method body
before writing anything — not a filename, not this file's summary. Every
constant you introduce carries its upstream `file:line`; a constant without a
citation is unfinished, and fitting a value to make a number improve is
forbidden even when it improves.

The sequence engine currently draws arrowheads as SVG `<marker>` references
(`renderer.ts:181-234`). The jar draws them as inline polygons and lines.
This task ports the shape vocabulary only — no rendering, no wiring. T3
consumes it.

## Task

Create `src/diagrams/sequence/sequence-arrowhead.ts` exporting the arrow
model and three geometry builders, plus its unit test. **Return geometry, not
SVG markup**: point lists and line segments, in tip-local coordinates. T3
translates them and emits via the shape emitters. This keeps
`tests/architecture/svg-emission-seam.test.ts` satisfied and makes the module
testable without string assertions.

Write the test first (TDD, `~/.claude/rules/testing.md`).

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/rose/ComponentRoseArrow.java:199-311`
  — `drawDressing1`, `drawDressing2`, `getPolygonNormal`, `getPolygonReverse`
- `.../skin/rose/AbstractComponentRoseArrow.java:54-55` — `arrowDeltaX = 10`,
  `arrowDeltaY = 4`
- `.../skin/rose/ComponentRoseSelfArrow.java:120-175,275-292` — the self
  variant's heads and its own `getPolygon`
- `.../skin/rose/Rose.java:340` — `niceArrow = param.strictUmlStyle() == false`
  (on by default)
- `.../skin/{ArrowHead,ArrowPart,ArrowDecoration}.java` — the closed enums
- `src/diagrams/sequence/ast.ts:32-38` — the `MessageStyle` union to adapt from
- `../decisions.md#d2` and `#d3`

## Interface contract — consumed by T3

```ts
type ArrowHeadKind   = 'NORMAL' | 'CROSSX' | 'ASYNC' | 'NONE';
type ArrowPart       = 'FULL' | 'TOP_PART' | 'BOTTOM_PART';
type ArrowDecoration = 'NONE' | 'CIRCLE';

interface ArrowDressing { readonly head: ArrowHeadKind; readonly part: ArrowPart }

interface ArrowConfiguration {
  readonly dressing1: ArrowDressing;      // tail side, reverse-pointing
  readonly dressing2: ArrowDressing;      // head side, normal-pointing
  readonly decoration1: ArrowDecoration;
  readonly decoration2: ArrowDecoration;
  readonly dashed: boolean;
}

interface HeadGeometry {
  readonly polygon?: readonly Point2D[];
  readonly lines?: readonly (readonly [Point2D, Point2D])[];
  readonly circle?: { readonly cx: number; readonly cy: number;
                      readonly d: number; readonly thickness: number };
}

const ARROW_DELTA_X = 10;      // AbstractComponentRoseArrow.java:54
const ARROW_DELTA_Y = 4;       // AbstractComponentRoseArrow.java:55
const NICE_ARROW_INSET = 4;    // ComponentRoseArrow.java:289
const DIAM_CIRCLE = 8;         // ComponentRoseArrow.java:80
const THIN_CIRCLE = 1.5;       // ComponentRoseArrow.java:81
const SPACE_CROSS_X = 6;       // ComponentRoseArrow.java:79

function arrowConfigurationFor(style: MessageStyle): ArrowConfiguration;
function headGeometryNormalSide(d: ArrowDressing, dec: ArrowDecoration, niceArrow: boolean): HeadGeometry;
function headGeometryReverseSide(d: ArrowDressing, dec: ArrowDecoration, niceArrow: boolean): HeadGeometry;
function headGeometrySelf(cfg: ArrowConfiguration, reverseDefine: boolean, niceArrow: boolean): HeadGeometry;
```

`Point2D` from `src/core/klimt/UTranslate.js`.

## The one trap — do not guess this

`ArrowDecoration.CIRCLE` comes from an explicit `o` in the arrow *syntax* —
`CommandArrow.java:367-371` (`circleAtEnd`/`circleAtStart`) and
`CommandExoArrowAny.java:109-116` (`ARROW_SUPPCIRCLE1/2`). It is **orthogonal
to lost/found**, which is `MessageExoType` and concerns where the line
terminates, not the head shape. So `'lost'` and `'found'` map to a plain
`NORMAL` head with `decoration: 'NONE'`. Mapping them to CIRCLE because the
names suggest a dot is the mistake this paragraph exists to prevent.

## Acceptance criteria

1. Given `part='FULL', niceArrow=true`, when `headGeometryNormalSide`, then
   the polygon is `[(-10,-4),(0,0),(-10,4),(-6,0)]` — `getPolygonNormal:287-290`
2. Given `part='TOP_PART'`, when `headGeometryReverseSide`, then
   `[(10,-4),(0,0),(10,0)]` with no nice-arrow point — `getPolygonReverse:293-296`
3. Given `head='ASYNC', part='FULL'`, when either side builder runs, then two
   line segments; given `part='TOP_PART'`, exactly one — `drawDressing2:246-254`
4. Given `style='lost'` or `'found'`, when `arrowConfigurationFor`, then
   `decoration1 === 'NONE' && decoration2 === 'NONE'` and the head is `NORMAL`
5. Given `style='reply'` or `'replyAsync'`, when `arrowConfigurationFor`, then
   `dashed === true`

## Quality bar

All four gates green: `npm test && npm run typecheck && npm run lint &&
npm run build`. The complexity hook blocks writes over 30 NLOC / 10 CCN / 5
params / 500 lines — a single builder handling all four head kinds will trip
CCN, so split per head kind from the start rather than discovering it.

Coverage is 90/90/90 and the CROSSX / TOP_PART / BOTTOM_PART branches are
unreachable from the corpus (D2) — their coverage must come from your unit
tests.

## Observability

N/A — no new observable operations. This module is pure geometry.

## Rollback

Reversible. New file plus new test; nothing else reads it until T3.

## Boundaries

- **Always:** cite `file:line` for every constant and every shape
- **Never:** emit SVG markup from this module; collapse the three polygon
  builders into one (D3); change `MessageStyle`, the AST, or the parser
- **Ask first:** if a shape cannot be reproduced from the Java without
  introducing an uncited number

## Commit

One commit: `feat(T1): port sequence arrow shape vocabulary`
