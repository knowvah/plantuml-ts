/**
 * The `scale …` directive for the json family, applied at the layout→render
 * boundary.
 *
 * ## Why here, and why it is the same thing upstream does
 *
 * Upstream applies scale in exactly one place: `SvgGraphics#format`
 * (`klimt/drawing/svg/SvgGraphics.java:466-473`) multiplies EVERY emitted
 * numeric by `option.getScale()` before rendering it to the requested number
 * of decimals. Nothing else in the drawing pipeline knows about scale — which
 * is why a `scale 2` diagram has `stroke-width:3` (`:555`, `strokeWidth =
 * format(strokeWidth)`) and `font-size="28"` (`:693`, `format(fontSize)`)
 * rather than a `transform` on the root group. Jar-verified against
 * `yaml/nuzaje-74-kenu009`: every numeric in that golden is exactly 2x.
 *
 * This port's json family does not render through klimt's `SvgGraphicsCore`
 * (which already carries a faithful scale-applying `format` — see
 * `description/renderer.ts`), but through the direct `core/svg*.ts` string
 * emitters, whose shared formatter is scale-free by design (ADR-3,
 * `svg-format.ts`: "this module never applies a default or a scale factor
 * itself"). So there is no single `format` seam to multiply through.
 *
 * Scaling the INPUTS instead is arithmetically the same operation:
 * `format(x·k)` is what upstream computes and `format(x·k)` is what this
 * produces, because scaling distributes over every derived value the renderer
 * computes from geometry (midpoints, baselines, spline control points are all
 * linear in their inputs). It also keeps three emitters — the pen, the shell
 * and `text` — free of a scale parameter each would have to thread correctly.
 *
 * ## Exhaustiveness
 *
 * The risk of scaling inputs is a MISSED field, which would emit at 1x beside
 * neighbours at k and look like a layout bug. That is not left to review: the
 * json family's structural gate compares every non-positional attribute
 * against the jar, and the two `scale` fixtures in the corpus
 * (`json/timafu-94-bixe774`, `yaml/nuzaje-74-kenu009`) are required clean, so
 * any unscaled numeric fails the build.
 *
 * ## Known limitation: `scale` + `skinparam handwritten true`
 *
 * Upstream jiggles at UNSCALED coordinates and scales at emit, because the
 * jiggle happens in `UGraphicHandwritten` and the scale in `SvgGraphics#format`
 * — two different stages. Scaling the inputs puts the jiggle downstream of the
 * scale instead, so a diagram that is BOTH scaled and handwritten would wobble
 * by a scaled amount rather than a constant one. No corpus fixture combines the
 * two, so this is unmeasured rather than known-wrong; fixing it means moving
 * the multiply into the pen's emit step, after `pathHand`/`rectangleHand` have
 * run.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/SvgGraphics.java#format
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/JsonDiagram.java#JsonDiagram (:90-99, runs the captured directive through CommonCommands)
 */

import type { JsonGeometry, JsonNodeGeo, JsonEdgeGeo } from './layout.js';
import type { NodeStyleJson } from './renderer-style.js';
import type { JsonRowGeo, CellAtom } from './TextBlockJson.js';

/** A scale of exactly 1 must be a no-op, not a rebuild — see {@link scaleJsonGeometry}. */
const IDENTITY = 1;

function scaleAtom(a: CellAtom, k: number): CellAtom {
  return { ...a, dx: a.dx * k, textLength: a.textLength * k };
}

function scaleRow(r: JsonRowGeo, k: number): JsonRowGeo {
  return {
    ...r,
    y: r.y * k,
    height: r.height * k,
    keyWidth: r.keyWidth * k,
    keyTextLength: r.keyTextLength * k,
    keyBaselineY: r.keyBaselineY * k,
    valueLineWidths: r.valueLineWidths.map((w) => w * k),
    valueTextLengths: r.valueTextLengths.map((w) => w * k),
    valueBaselineYs: r.valueBaselineYs.map((y) => y * k),
    keyAtoms: r.keyAtoms.map((a) => scaleAtom(a, k)),
    valueAtoms: r.valueAtoms.map((line) => line.map((a) => scaleAtom(a, k))),
  };
}

function scaleNode(n: JsonNodeGeo, k: number): JsonNodeGeo {
  return {
    ...n,
    x: n.x * k,
    y: n.y * k,
    width: n.width * k,
    height: n.height * k,
    keyColWidth: n.keyColWidth * k,
    valueColWidth: n.valueColWidth * k,
    rows: n.rows.map((r) => scaleRow(r, k)),
  };
}

function scaleEdge(e: JsonEdgeGeo, k: number): JsonEdgeGeo {
  return { ...e, points: e.points.map((p) => ({ x: p.x * k, y: p.y * k })) };
}

/**
 * Every geometric number in the diagram, multiplied by `k`.
 *
 * Returns the input unchanged when `k` is 1 so the overwhelmingly common
 * unscaled case allocates nothing and cannot be perturbed by a rounding
 * artefact of multiplying by one.
 */
export function scaleJsonGeometry(geo: JsonGeometry, k: number): JsonGeometry {
  if (k === IDENTITY) return geo;
  const errorLayout = geo.errorLayout;
  return {
    ...geo,
    width: geo.width * k,
    height: geo.height * k,
    nodes: geo.nodes.map((n) => scaleNode(n, k)),
    edges: geo.edges.map((e) => scaleEdge(e, k)),
    ...(errorLayout === undefined
      ? {}
      : {
          errorLayout: {
            x: errorLayout.x * k,
            y: errorLayout.y * k,
            textLength: errorLayout.textLength * k,
          },
        }),
  };
}

/**
 * The style numbers that reach the SVG as their own attributes rather than
 * through geometry: font size, the two line thicknesses, and the corner
 * radius. Upstream scales these for exactly the reason it scales coordinates —
 * `strokeWidth` (`SvgGraphics.java:555`) and `font-size` (`:693`) both go
 * through the same `format`.
 *
 * Applied to the RESOLVED style rather than to the theme, and that is
 * load-bearing: `resolveNodeStyle` fills unset fields from constants in
 * `renderer-style.ts` (`NODE_LINE_THICKNESS`, `SEPARATOR_LINE_THICKNESS`,
 * `NODE_ROUND_CORNER`), so a theme-level pass would scale a user's override
 * and silently leave the default at 1x. Scaling after resolution is the only
 * point at which override and default are the same value.
 */
export function scaleNodeStyle(style: NodeStyleJson, k: number): NodeStyleJson {
  if (k === IDENTITY) return style;
  return {
    ...style,
    scale: k,
    box: {
      ...style.box,
      borderWidth: style.box.borderWidth * k,
      sepThickness: style.box.sepThickness * k,
      rx: style.box.rx * k,
    },
    text: { ...style.text, fontSize: style.text.fontSize * k },
  };
}
