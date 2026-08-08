/**
 * Shared per-USymbol leaf-shape renderers — the SVG for a descriptive element's
 * icon (component notch, database cylinder, actor stick-figure, usecase ellipse).
 * Pure geometry: a shape is a function of its box ({@link IconGeo}) + theme, so
 * every cuca engine (description, class, …) draws the same icon.
 *
 * The four shapes below are faithful ports of upstream's exact geometry
 * (decisions.md#D5 "USymbol geometry"): USymbolDatabase.java, USymbolComponent2
 * .java, ActorStickMan.java, USymbolUsecase/TextBlockInEllipse.java. Each
 * resolves its own color via {@link resolveElementPaint} for its SName (D4) —
 * no shape reads a hard-coded class-bucket field — and draws through the
 * Paint-aware svg primitives so gradient fills (e.g. a database gradient) work.
 */
import type { Theme } from './theme.js';
import { resolveElementPaint } from './theme.js';
import type { Paint } from './paint.js';
import { rect, text, ellipse, line, path , attrs, resolvePaint} from './svg.js';
import { renderNodeLabel } from './latex.js';

/** The minimal node geometry a USymbol shape needs. */
export interface IconGeo {
  x: number;
  y: number;
  width: number;
  height: number;
  display: string;
  /**
   * Draws the label instead of the default `renderNodeLabel(display, …)`,
   * given the centre-x and baseline-y this icon would have used. Supplied by
   * a caller whose label needs more than a single `<text>` -- e.g. a display
   * carrying a `<$sprite>` atom, which must emit an `<image>` plus the
   * remaining text runs. Kept as a callback so this module stays free of any
   * one engine's atom types; `src/core` must not depend on `src/diagrams`.
   */
  renderLabel?: ((cx: number, baselineY: number) => string) | undefined;
}

/**
 * A `<path>` filled with a {@link Paint} (svg.ts `path` is stroke-only,
 * `fill="none"`). Resolves the fill/stroke paints, prepending any gradient
 * `<linearGradient>` defs (deduped later by svgRoot).
 */
function filledPath(d: string, fill: Paint, stroke: Paint): string {
  // resolvePaint, not paintToSvg: the former applies rule 2 to a gradient's
  // <stop stop-color> values (svg.ts#shortenStopColors); the raw paintToSvg
  // leaves them 6-digit, which the jar does not.
  const f = resolvePaint(fill);
  const s = resolvePaint(stroke);
  // Through `attrs` rather than interpolated by hand: that is the one place
  // rule 1 (decimal formatting) and rule 2 (`shortenColor`) are applied, and
  // a `<path>` built by string concatenation reaches the output with neither
  // -- this site emitted `fill="#AA1122"` where the jar emits `#A12`.
  return (
    `${f.def}${s.def}` +
    `<path${attrs([
      ['d', d],
      ['fill', f.value],
      ['stroke', s.value],
      ['stroke-width', 1],
    ] as const)}/>`
  );
}

/** Database cylinder body outline (cubic caps, fixed 10px depth). */
function databaseBodyPath(x: number, y: number, w: number, h: number): string {
  return (
    `M ${x},${y + 10} ` +
    `C ${x},${y} ${x + w / 2},${y} ${x + w / 2},${y} ` +
    `C ${x + w / 2},${y} ${x + w},${y} ${x + w},${y + 10} ` +
    `L ${x + w},${y + h - 10} ` +
    `C ${x + w},${y + h} ${x + w / 2},${y + h} ${x + w / 2},${y + h} ` +
    `C ${x + w / 2},${y + h} ${x},${y + h} ${x},${y + h - 10} ` +
    `L ${x},${y + 10} Z`
  );
}

/** Database front-mouth arc (lip at y=20). */
function databaseMouthPath(x: number, y: number, w: number): string {
  return (
    `M ${x},${y + 10} ` +
    `C ${x},${y + 20} ${x + w / 2},${y + 20} ${x + w / 2},${y + 20} ` +
    `C ${x + w / 2},${y + 20} ${x + w},${y + 20} ${x + w},${y + 10}`
  );
}

/**
 * USymbol: database → cylinder. Faithful port of USymbolDatabase.java:61-87 —
 * one path with cubic caps of fixed 10px depth (independent of height), plus a
 * front-mouth arc whose lip sits at y=20.
 */
export function renderDatabaseIcon(node: IconGeo, theme: Theme): string {
  const { x, y, width: w, height: h, display } = node;
  const bg = resolveElementPaint(theme, 'database', 'background');
  const stroke = resolveElementPaint(theme, 'database', 'border');
  const body = filledPath(databaseBodyPath(x, y, w, h), bg, stroke);
  // Front lip: stroked only (upstream fills the closing path with none).
  const mouth = path(databaseMouthPath(x, y, w), { stroke, strokeWidth: 1 });
  const labelEl = text(x + w / 2, y + (h + 20) / 2 + theme.fontSize / 3, display, {
    fontFamily: theme.fontFamily,
    fontSize: theme.fontSize,
    fill: resolveElementPaint(theme, 'database', 'font'),
    textAnchor: 'middle',
  });
  return body + mouth + labelEl;
}

/**
 * USymbol: component → UML2 box with a two-tab notch. Faithful port of
 * USymbolComponent2.java:59-75 — body rect plus an outer tab (15×10 at
 * (w-20,5)) and two inner ticks (4×2 at (w-22,7) and (w-22,11)).
 */
export function renderComponentIcon(node: IconGeo, theme: Theme): string {
  const { x, y, width: w, height: h, display } = node;
  const bg = resolveElementPaint(theme, 'component', 'background');
  const stroke = resolveElementPaint(theme, 'component', 'border');
  const box = { fill: bg, stroke, strokeWidth: 1 };
  const body = rect(x, y, w, h, box);
  const outerTab = rect(x + w - 20, y + 5, 15, 10, box);
  const tick1 = rect(x + w - 22, y + 7, 4, 2, box);
  const tick2 = rect(x + w - 22, y + 11, 4, 2, box);
  const labelEl = text(
    x + w / 2,
    y + h / 2 + theme.fontSize / 2,
    display,
    {
      fontFamily: theme.fontFamily,
      fontSize: theme.fontSize,
      fill: resolveElementPaint(theme, 'component', 'font'),
      textAnchor: 'middle',
    },
  );
  return body + outerTab + tick1 + tick2 + labelEl;
}

/**
 * USymbol: actor → stick figure. Faithful port of ActorStickMan.java:51-96 —
 * head Ø16 (centre y=8); body translated to (cx, 16): spine (0,0)→(0,27),
 * arms (-13,8)→(13,8), legs (0,27)→(∓13,42).
 *
 * SI14 T4: the class engine's production path (a real `StringMeasurer` on
 * `ClassGeometry`) no longer calls this for an actor leaf -- it draws
 * through the faithful `EntityImageDescription.drawU` instead
 * (`renderer-usymbol-entity.ts`). This remains the FALLBACK for hand-built
 * `ClassifierGeo` test fixtures that bypass `layoutClass` (no measurer to
 * reconstruct with) -- see `class-geo-types.ts#ClassGeometry.measurer`'s
 * own doc comment. The label placement below is this fallback's own plain
 * approximation, not a jar-fidelity claim.
 */
export function renderActorIcon(node: IconGeo, theme: Theme): string {
  const { x, y, width: w, display } = node;
  const cx = x + w / 2;
  const stroke = resolveElementPaint(theme, 'actor', 'border');
  const headFill = resolveElementPaint(theme, 'actor', 'background');
  const head = ellipse(cx, y + 8, 8, 8, {
    fill: headFill,
    stroke,
    'stroke-width': 1,
  });
  // Body translated to (cx, y+16): spine, arms, legs at the cited offsets.
  const bodyTop = y + 16;
  const spine = line(cx, bodyTop, cx, bodyTop + 27, { stroke });
  const arms = line(cx - 13, bodyTop + 8, cx + 13, bodyTop + 8, { stroke });
  const leftLeg = line(cx, bodyTop + 27, cx - 13, bodyTop + 42, { stroke });
  const rightLeg = line(cx, bodyTop + 27, cx + 13, bodyTop + 42, { stroke });
  return (
    head +
    spine +
    arms +
    leftLeg +
    rightLeg +
    drawLabel(node, display, cx, bodyTop + 42 + theme.fontSize, theme)
  );
}

/**
 * USymbol: usecase → horizontal ellipse (sized to the node box, which layout
 * sized to the text footprint `.bigger(6)`) with a centred label.
 *
 * SI14 T4: the label baseline here is a PLAIN vertical-centring formula
 * (`cy + fontSize/3`, the same convention {@link renderDatabaseIcon}/
 * {@link renderComponentIcon} already use for their own labels) -- it no
 * longer carries the `cy - 2 + fontSize/3` constant a prior iteration tuned
 * to approximate `TextBlockInEllipse`'s real behavior. That approximation
 * was content-independent (a fixed constant) where the jar's own offset is
 * content-dependent (the fitted ellipse's OWN stored centre, `dy - 2`) --
 * an approximation this function cannot faithfully reproduce without the
 * real fit, which is exactly why T4 gives the MEASURED path (a real
 * `StringMeasurer` on `ClassGeometry`) its own faithful draw via
 * `EntityImageDescription.drawU` instead (`renderer-usymbol-entity.ts`).
 * This function remains ONLY the fallback for hand-built `ClassifierGeo`
 * test fixtures with no measurer to reconstruct with -- see `class-geo-
 * types.ts#ClassGeometry.measurer`'s own doc comment -- so simplifying its
 * label offset to the same plain convention every other fallback icon here
 * already uses is strictly a clarity change, not a fidelity regression.
 */
export function renderUseCaseIcon(node: IconGeo, theme: Theme): string {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const oval = ellipse(cx, cy, node.width / 2, node.height / 2, {
    fill: resolveElementPaint(theme, 'usecase', 'background'),
    stroke: resolveElementPaint(theme, 'usecase', 'border'),
  });
  return oval + drawLabel(node, node.display, cx, cy + theme.fontSize / 3, theme);
}

/** The caller's own label drawing when it supplied one, else the default
 *  single-`<text>` path. */
function drawLabel(
  node: IconGeo,
  display: string,
  cx: number,
  baselineY: number,
  theme: Theme,
): string {
  return node.renderLabel !== undefined
    ? node.renderLabel(cx, baselineY)
    : renderNodeLabel(display, cx, baselineY, theme);
}

type IconRenderer = (node: IconGeo, theme: Theme) => string;

/** USymbol keyword → leaf-icon renderer (only the shapes with a distinct icon). */
const USYMBOL_ICONS = new Map<string, IconRenderer>([
  ['database', renderDatabaseIcon],
  ['component', renderComponentIcon],
  ['actor', renderActorIcon],
  ['usecase', renderUseCaseIcon],
]);

/**
 * Render a descriptive element's icon for the given USymbol keyword, or
 * `undefined` when there is no distinct icon (the caller draws a plain rect).
 */
export function renderUSymbolIcon(
  usymbol: string,
  node: IconGeo,
  theme: Theme,
): string | undefined {
  return USYMBOL_ICONS.get(usymbol.toLowerCase())?.(node, theme);
}
