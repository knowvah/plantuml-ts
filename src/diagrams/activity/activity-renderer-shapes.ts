/**
 * Activity node-shape rendering: per-shape SVG emitters (start/stop/end,
 * action, bar, diamond, chevrons, hexagon, parallelogram, note) plus the
 * renderNode dispatcher and shared label/color helpers. Split out of
 * `renderer.ts` (line cap); leaf consumed by edge/swimlane rendering.
 */

import type { ActivityNodeGeo } from './layout/tile-layout.js';
import type { Theme } from '../../core/theme.js';
import type {} from '../../core/dispatcher.js';
import {
  rect,
  text,
  diamond,
  noteBox,
  ellipse,
  line,
  path,
  polygon,
  resolvePaint,
  type TextStyle,
} from '../../core/svg.js';
import { renderNodeLabel } from '../../core/latex.js';
import { NOTE_FOLD } from './activity-layout-constants.js';
import {
  CIRCLE_END_LINE_THICKNESS,
  CIRCLE_INK,
  CIRCLE_LINE_THICKNESS,
  NOTE_LINE_THICKNESS,
  activityFontSize,
  activityLineThickness,
  activityPadding,
  activityRoundCorner,
} from './activity-style-defaults.js';
import { activityFontColor } from './activity-text-style.js';
/** `rx` and `ry` are each HALF the resolved `RoundCorner`
 *  (`URectangle#build().rounded()`'s halving convention, D4). The port
 *  previously wrote a bare `rx = 8` with no `ry` at all; 8 was unsourced,
 *  and upstream's `activityDiagram { activity { RoundCorner 25 } }`
 *  (`plantuml.skin:362`) makes both axes 12.5. */
function actionCornerRadius(theme: Theme): number {
  return activityRoundCorner(theme, 'activity') / 2;
}

// ---------------------------------------------------------------------------
// Multi-line labels: one <text> per line, T3 (aeg)
// ---------------------------------------------------------------------------

/**
 * The per-line baseline ADVANCE, and the ASCENT fraction used to place a
 * centred block's first line -- T3's D4 citation. Verified on
 * `boxoto-53-sifo232`: the jar's two label lines sit at y=139.333 and
 * y=151.333, 12.0 apart at `font-size="12"` -- an advance of EXACTLY 1x
 * font size, not the `fontSize * 1.4` this file used before T3.
 * @see net/sourceforge/plantuml/klimt/drawing/font/StringBounderFromWidthTable.java:71
 *      -- `calculateDimension`'s returned height is `size` (the raw font
 *      size), unconditionally: `final double height = size;`.
 * @see net/sourceforge/plantuml/klimt/font/StringBounder.java:47 -- the
 *      default `getDescent` is `font.getSize2D() / 4.5`.
 * This port's own `WidthTableMeasurer` (`src/core/measurer.ts`) already
 * carries both as `measure(text, font).height === font.size` and
 * `getDescent(font, text) === font.size / 4.5`, and sequence's own
 * multi-line note bodies use exactly this formula
 * (`sequence-layout-events.ts#noteBodyRuns`). Activity's per-line advance
 * mirrors it: `ASCENT_FRACTION = 1 - 1/4.5 = 7/9`, replacing the old
 * `lh * 0.8` approximation (0.8 was already close to 7/9 ≈ 0.7778 --
 * likely someone's earlier hand-rounding of the same ratio, never cited).
 */
const ASCENT_FRACTION = 1 - 1 / 4.5;

/**
 * One `<text>` element PER LINE, never `<tspan>` (D3). Upstream draws a
 * multi-line label as N separate `<text>` draws; `<tspan>` is reserved for
 * creole's own multi-STYLE-run serialisation within a single line
 * (`src/core/creole-svg.ts`, not this function's concern -- none of this
 * file's multi-line call sites carry creole markup, only `\n`-split text).
 */
function textLines(
  lines: readonly string[],
  x: number,
  firstBaselineY: number,
  lineHeight: number,
  style: TextStyle,
): string {
  return lines.map((ln, i) => text(x, firstBaselineY + lineHeight * i, ln, style)).join('');
}

/** First baseline Y so an N-line block is vertically centred around `cy`,
 *  using the cited advance/ascent above instead of the old `lh * 0.8`. */
function centeredFirstBaselineY(cy: number, lineHeight: number, lineCount: number): number {
  return cy - (lineHeight * lineCount) / 2 + lineHeight * ASCENT_FRACTION;
}

/** `fontSize` defaults to the ACTION box's resolved size: every call site
 *  in this file draws an activity-box label, at the value the sizer
 *  measured (`tiles/gtile-action.ts`); a DIFFERENT element passes its own
 *  resolved size rather than silently inheriting the action's. */
export function renderLabel(label: string, cx: number, cy: number, theme: Theme, fontSize?: number): string {
  return renderNodeLabel(label, cx, cy, theme, fontSize ?? activityFontSize(theme, 'activity'));
}

export function renderMultilineText(
  lines: string[],
  cx: number,
  cy: number,
  theme: Theme,
  opts: { sname: 'activity' | 'diamond'; fontSize?: number },
): string {
  const size = opts.fontSize ?? activityFontSize(theme, 'activity');
  const y = centeredFirstBaselineY(cy, size, lines.length);
  return textLines(lines, cx, y, size, {
    textAnchor: 'middle',
    fontFamily: theme.fontFamily,
    fontSize: size,
    fill: activityFontColor(theme, opts.sname),
  });
}

// ---------------------------------------------------------------------------
// Activity-specific color resolution
// ---------------------------------------------------------------------------

export interface ActivityColors {
  nodeFill: string;
  nodeBorder: string;
  barFill: string;
  startFill: string;
  endFill: string;
  diamondFill: string;
  diamondBorder: string;
}

export function actColors(theme: Theme): ActivityColors {
  const act = theme.colors.graph.activity;
  return {
    nodeFill: act?.background ?? theme.colors.nodeBackground,
    nodeBorder: act?.border ?? theme.colors.border,
    barFill: act?.barColor ?? theme.colors.border,
    // `activityDiagram { circle { start, stop, end { LineColor #2;
    // BackgroundColor #2 } } }` (plantuml.skin:379-380) -- the SAME token
    // for stroke and fill. `#2` is upstream's one-digit hex shorthand,
    // resolved through the ported `HColorSet` digit-length parser (D5),
    // never written as a literal. A user's `skinparam ActivityStartColor`
    // still wins: the built-in default is the LAST tier, not the first.
    startFill: act?.startColor ?? CIRCLE_INK,
    endFill: act?.endColor ?? CIRCLE_INK,
    diamondFill: act?.diamondBackground ?? theme.colors.nodeBackground,
    diamondBorder: act?.diamondBorder ?? theme.colors.border,
  };
}

// ---------------------------------------------------------------------------
// Node shape renderers
// ---------------------------------------------------------------------------

export function renderStart(node: ActivityNodeGeo, theme: Theme): string {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const r = node.height / 2;
  // @see net/sourceforge/plantuml/klimt/drawing/svg/DriverEllipseSvg.java --
  // upstream's start/end/kill circles are all UEllipse shapes (equal
  // radii), never a dedicated circle driver.
  //
  // `resolvePaint` here replicates exactly what `circle()`'s own
  // `resolvePaint(style.fill)` did -- `ellipse()`'s `extraAttrs` only
  // shortens an ALREADY-hex string (rule 2); it does not resolve a named
  // CSS color (e.g. "blue") to hex the way `circle()`'s pipeline did via
  // `paintToSvg`. Pre-resolving here keeps that behaviour byte-identical.
  // `LineThickness 1` on the start/stop/end block (plantuml.skin:378). The
  // jar draws the start terminal with BOTH a fill and a stroke in the same
  // colour; this port drew a fill only, so the ellipse was a hair small.
  const ink = resolvePaint(actColors(theme).startFill).value;
  return ellipse(cx, cy, r, r, { fill: ink, stroke: ink, 'stroke-width': CIRCLE_LINE_THICKNESS });
}

export function renderStop(node: ActivityNodeGeo, theme: Theme): string {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const outerR = node.height / 2;
  const innerR = outerR * 0.55;
  const c = actColors(theme);
  return (
    // `stop` takes the block's own `LineThickness 1` (plantuml.skin:378);
    // only `end` is overridden to 1.5 one block later (:383), and upstream
    // gives the two DISTINCT StyleSignatures
    // (`ftile/vcompact/VCompactFactory.java:97` vs `:101`).
    ellipse(cx, cy, outerR, outerR, {
      fill: 'none',
      stroke: resolvePaint(c.endFill).value,
      'stroke-width': CIRCLE_LINE_THICKNESS,
    }) + ellipse(cx, cy, innerR, innerR, { fill: resolvePaint(c.endFill).value })
  );
}

/**
 * Renders an `end` node as a circle with an X through it, matching upstream
 * PlantUML's distinction between `stop` (bullseye) and `end` (crossed circle).
 */
export function renderEnd(node: ActivityNodeGeo, theme: Theme): string {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const r = node.height / 2;
  // Diagonal length so the X tips reach the circle border at 45°
  const d = r * Math.SQRT1_2;
  const endFill = actColors(theme).endFill;
  return (
    // `activityDiagram { circle { end { LineThickness 1.5 } } }`
    // (plantuml.skin:383) -- the `end` terminal ALONE overrides the
    // start/stop/end block's 1.
    ellipse(cx, cy, r, r, {
      fill: 'none',
      stroke: resolvePaint(endFill).value,
      'stroke-width': CIRCLE_END_LINE_THICKNESS,
    }) +
    line(cx - d, cy - d, cx + d, cy + d, { stroke: endFill, strokeWidth: CIRCLE_END_LINE_THICKNESS }) +
    line(cx - d, cy + d, cx + d, cy - d, { stroke: endFill, strokeWidth: CIRCLE_END_LINE_THICKNESS })
  );
}

const CODE_BLOCK_RE = /^<code>([\s\S]*?)<\/code>$/i;

export function renderAction(node: ActivityNodeGeo, theme: Theme): string {
  // `activityDiagram { activity { FontSize 12 } }` (plantuml.skin:361) --
  // the SAME value `tiles/gtile-action.ts` measured this box at, so the
  // renderer draws into exactly the space the sizer reserved.
  const actionSize = activityFontSize(theme, 'activity');
  const c = actColors(theme);
  const fill = node.color ?? c.nodeFill;
  const box = rect(node.x, node.y, node.width, node.height, {
    fill,
    stroke: c.nodeBorder,
    strokeWidth: activityLineThickness(theme, 'activity'),
    rx: actionCornerRadius(theme),
    ry: actionCornerRadius(theme),
  });
  const label = node.label ?? '';
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;

  // <code>...</code> block — render left-aligned in monospace, strip the tags.
  const codeMatch = CODE_BLOCK_RE.exec(label.trim());
  if (codeMatch !== null) {
    const codeContent = codeMatch[1]!.replace(/^\n/, '').replace(/\n$/, '');
    const codeLines = codeContent.split('\n');
    const monoFamily = 'monospace';
    const lh = actionSize;
    const lineY = centeredFirstBaselineY(cy, lh, codeLines.length);
    const labelX = node.x + activityPadding('activity');
    const labelText = textLines(codeLines, labelX, lineY, lh, {
      textAnchor: 'start',
      fontFamily: monoFamily,
      fontSize: actionSize,
      fill: activityFontColor(theme, 'activity'),
    });
    return box + labelText;
  }

  const lines = label.split('\n');
  let labelEl: string;
  if (lines.length > 1) {
    const lh = actionSize;
    const lineY = centeredFirstBaselineY(cy, lh, lines.length);
    const labelX = node.x + activityPadding('activity');
    const labelText = textLines(lines, labelX, lineY, lh, {
      textAnchor: 'start',
      fontFamily: theme.fontFamily,
      fontSize: actionSize,
      fill: activityFontColor(theme, 'activity'),
    });
    labelEl = labelText;
  } else {
    labelEl = renderLabel(label, cx, cy + actionSize / 3, theme, actionSize);
  }
  return box + labelEl;
}

export function renderBar(node: ActivityNodeGeo, theme: Theme): string {
  return rect(node.x, node.y, node.width, node.height, {
    fill: actColors(theme).barFill,
  });
}

export function renderDiamond(node: ActivityNodeGeo, theme: Theme): string {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const size = node.width / 2;
  const c = actColors(theme);
  const shape = diamond(cx, cy, size, {
    fill: c.diamondFill,
    stroke: c.diamondBorder,
  });
  if (node.label === undefined || node.label === '') return shape;
  const label = text(cx, cy, node.label, {
    fontFamily: theme.fontFamily,
    // `activityDiagram { diamond { FontSize 11 } }` (plantuml.skin:370),
    // the same value `tiles/gtile-diamond.ts` measured it at. The former
    // `theme.fontSize - 2` reached 12, not 11.
    fontSize: activityFontSize(theme, 'diamond'),
    fill: activityFontColor(theme, 'diamond'),
    textAnchor: 'middle',
    dominantBaseline: 'middle',
  });
  return shape + label;
}

export function renderSignalLabel(label: string, x: number, cy: number, theme: Theme): string {
  // A signal/chevron is an `FtileBox` with an SDL `BoxStyle`, so it
  // resolves `SName.activity` like the plain box does
  // (`ftile/vertical/FtileBox.java:97-99`, `:146`) -- which is also the
  // SName `tiles/gtile-action.ts` sizes it at.
  const size = activityFontSize(theme, 'activity');
  const labelX = x + activityPadding('activity');
  const lines = label.split('\n');
  if (lines.length === 1) {
    return text(labelX, cy, label, {
      fill: activityFontColor(theme, 'activity'),
      fontFamily: theme.fontFamily,
      fontSize: size,
      textAnchor: 'start',
      dominantBaseline: 'central',
    });
  }
  const lineY = centeredFirstBaselineY(cy, size, lines.length);
  const labelText = textLines(lines, labelX, lineY, size, {
    textAnchor: 'start',
    fontFamily: theme.fontFamily,
    fontSize: size,
    fill: activityFontColor(theme, 'activity'),
  });
  return labelText;
}

export function renderChevronLeft(node: ActivityNodeGeo, theme: Theme): string {
  const { x, y, width: w, height: h } = node;
  const c = actColors(theme);
  const fill = node.color ?? c.nodeFill;
  // <<input>> = UML receive signal: flat left side (right-angle corners at
  // top-left and bottom-left). Right side: two lines from top-right and
  // bottom-right corners go inward/left at 60° to horizontal, meeting at
  // the midpoint of the right edge → concave right notch pointing left.
  // dent = (h/2) / tan(60°) = h / (2√3)
  const dent = h / (2 * Math.sqrt(3));
  const shape = polygon(
    [
      { x: x, y: y },
      { x: x + w, y: y },
      { x: x + w - dent, y: y + h / 2 },
      { x: x + w, y: y + h },
      { x: x, y: y + h },
    ],
    { fill, stroke: c.nodeBorder, strokeWidth: activityLineThickness(theme, 'activity') },
  );
  return shape + renderSignalLabel(node.label ?? '', x, y + h / 2, theme);
}

export function renderChevronRight(node: ActivityNodeGeo, theme: Theme): string {
  const { x, y, width: w, height: h } = node;
  const c = actColors(theme);
  const fill = node.color ?? c.nodeFill;
  // 60° to horizontal: dent = (h/2) / tan(60°) = h / (2√3)
  const dent = h / (2 * Math.sqrt(3));
  // <<output>> = right-pointing arrow: body rectangle indented on right,
  // vertex pointing right at the midpoint of the right edge.
  const shape = polygon(
    [
      { x: x, y: y },
      { x: x + w - dent, y: y },
      { x: x + w, y: y + h / 2 },
      { x: x + w - dent, y: y + h },
      { x: x, y: y + h },
    ],
    { fill, stroke: c.nodeBorder, strokeWidth: activityLineThickness(theme, 'activity') },
  );
  return shape + renderSignalLabel(node.label ?? '', x, y + h / 2, theme);
}

export function renderHexagon(node: ActivityNodeGeo, theme: Theme): string {
  const { x, y, width: w, height: h } = node;
  const c = actColors(theme);
  const fill = node.color ?? c.diamondFill;
  const dent = h / 2;
  const shape = polygon(
    [
      { x: x + dent, y: y },
      { x: x + w - dent, y: y },
      { x: x + w, y: y + h / 2 },
      { x: x + w - dent, y: y + h },
      { x: x + dent, y: y + h },
      { x: x, y: y + h / 2 },
    ],
    { fill, stroke: c.diamondBorder, strokeWidth: activityLineThickness(theme, 'diamond') },
  );
  const cx = x + w / 2;
  const cy = y + h / 2;
  const condSize = activityFontSize(theme, 'diamond');
  const lines = (node.label ?? '').split('\n');
  const labelEl =
    lines.length > 1
      ? // A labelled condition. `gtile/GtileIfHexagon.java:184` and
        // `gtile/GtileHexagonInside.java:64` resolve `of(root, element,
        // activityDiagram, activity, diamond)` -- the same SName
        // `tiles/gtile-diamond.ts` measured it at, so `FontSize 11`
        // (plantuml.skin:370), not the action box's 12.
        renderMultilineText(lines, cx, cy, theme, { sname: 'diamond', fontSize: condSize })
      : renderLabel(node.label ?? '', cx, cy + condSize / 3, theme, condSize);
  return shape + labelEl;
}

export function renderParallelogram(node: ActivityNodeGeo, theme: Theme): string {
  const { x, y, width: w, height: h } = node;
  const c = actColors(theme);
  const fill = node.color ?? c.nodeFill;
  // Right-leaning parallelogram: interior angles 75° (acute) / 105° (obtuse).
  // tan(75°) = h/d  →  d = h / (2 + √3) = h · (2 − √3)
  const d = h * (2 - Math.sqrt(3));
  const shape = polygon(
    [
      { x: x + d, y: y },
      { x: x + w, y: y },
      { x: x + w - d, y: y + h },
      { x: x, y: y + h },
    ],
    { fill, stroke: c.nodeBorder, strokeWidth: activityLineThickness(theme, 'activity') },
  );
  const cx = x + w / 2;
  const cy = y + h / 2;
  const boxSize = activityFontSize(theme, 'activity');
  const lines = (node.label ?? '').split('\n');
  const labelEl =
    lines.length > 1
      ? // `BoxStyle.SDL_SAVE` (`ftile/BoxStyle.java:73`) is still an
        // `FtileBox`, so it resolves `SName.activity` like the plain box
        // (`ftile/vertical/FtileBox.java:97-99`) -- the same SName
        // `tiles/gtile-action.ts` measured it at.
        renderMultilineText(lines, cx, cy, theme, { sname: 'activity', fontSize: boxSize })
      : renderLabel(node.label ?? '', cx, cy + boxSize / 3, theme, boxSize);
  return shape + labelEl;
}

export function renderNote(node: ActivityNodeGeo, theme: Theme): string {
  const { x, y, width: w, height: h } = node;
  const noteFill = theme.colors.noteBackground;
  const stroke = theme.colors.border;
  // The ROOT `note { FontSize 13; LineThickness 0.5 }` block
  // (plantuml.skin:323,325). An activity note resolves `SName.note` under
  // `activityDiagram` (`ftile/vcompact/FtileWithNoteOpale.java:89`,
  // `ftile/vcompact/FtileNoteAlone.java:77`) and `activityDiagram { }`
  // declares no `note` override, so the root values stand. This is the
  // same size `tiles/gtile-note.ts` measured the box at.
  const noteSize = activityFontSize(theme, 'note');
  // Opale balloon spike geometry (matches Opale.java: delta=4, cornersize=NOTE_FOLD)
  const DELTA = 4;
  const spike = node.spikeTip;
  let bodyPath = '';
  if (spike !== undefined && node.notePosition === 'left') {
    // Note is LEFT of action → spike protrudes from the RIGHT side of the box
    const relY = spike.y - y;
    const y1 = Math.max(NOTE_FOLD, Math.min(relY - DELTA, h - 2 * DELTA));
    bodyPath =
      `M${x},${y} ` +
      `L${x},${y + h} ` +
      `L${x + w},${y + h} ` +
      `L${x + w},${y + y1 + 2 * DELTA} ` +
      `L${spike.x},${spike.y} ` +
      `L${x + w},${y + y1} ` +
      `L${x + w},${y + NOTE_FOLD} ` +
      `L${x + w - NOTE_FOLD},${y} Z`;
  } else if (spike !== undefined && node.notePosition === 'right') {
    // Note is RIGHT of action → spike protrudes from the LEFT side of the box
    const relY = spike.y - y;
    const y1 = Math.max(0, Math.min(relY - DELTA, h - 2 * DELTA));
    bodyPath =
      `M${x},${y} ` +
      `L${x},${y + y1} ` +
      `L${spike.x},${spike.y} ` +
      `L${x},${y + y1 + 2 * DELTA} ` +
      `L${x},${y + h} ` +
      `L${x + w},${y + h} ` +
      `L${x + w},${y + NOTE_FOLD} ` +
      `L${x + w - NOTE_FOLD},${y} Z`;
  }
  // Build the note body — spike cases use the custom path; standalone uses the shared primitive
  const body =
    spike === undefined
      ? noteBox(x, y, w, h, { fill: noteFill, stroke, dogEar: NOTE_FOLD, strokeWidth: NOTE_LINE_THICKNESS })
      : path(bodyPath, { fill: noteFill, stroke, strokeWidth: NOTE_LINE_THICKNESS }) +
        line(x + w - NOTE_FOLD, y, x + w - NOTE_FOLD, y + NOTE_FOLD, { stroke, strokeWidth: NOTE_LINE_THICKNESS }) +
        line(x + w - NOTE_FOLD, y + NOTE_FOLD, x + w, y + NOTE_FOLD, {
          stroke,
          strokeWidth: NOTE_LINE_THICKNESS,
        });

  const label = node.label ?? '';
  const lines = label.split('\n');
  const labelX = x + 4;
  let labelEl: string;
  if (lines.length > 1) {
    labelEl = textLines(lines, labelX, y + NOTE_FOLD + noteSize, noteSize, {
      textAnchor: 'start',
      fontFamily: theme.fontFamily,
      fontSize: noteSize,
      fill: activityFontColor(theme, 'note'),
    });
  } else {
    labelEl = text(labelX, y + NOTE_FOLD + noteSize, label, {
      fill: activityFontColor(theme, 'note'),
      fontFamily: theme.fontFamily,
      fontSize: noteSize,
    });
  }
  return body + labelEl;
}

export function renderNode(node: ActivityNodeGeo, theme: Theme): string {
  switch (node.kind) {
    case 'start':
      return renderStart(node, theme);
    case 'stop':
    case 'kill':
      return renderStop(node, theme);
    case 'end':
      return renderEnd(node, theme);
    case 'action':
      if (node.stereotype === 'input') return renderChevronLeft(node, theme);
      if (node.stereotype === 'output') return renderChevronRight(node, theme);
      if (node.stereotype === 'save') return renderParallelogram(node, theme);
      return renderAction(node, theme);
    case 'break':
      // `break` is a flow-control marker — it has no visible glyph in
      // upstream PlantUML. The layout still places a zero-area anchor for
      // edge routing, but rendering produces no shape.
      return '';
    case 'repeat-start':
      return renderDiamond(node, theme);
    case 'fork-bar':
    case 'split-bar':
    case 'join-bar':
      return renderBar(node, theme);
    case 'if-split':
    case 'while-header':
      return node.label !== undefined && node.label !== '' ? renderHexagon(node, theme) : renderDiamond(node, theme);
    case 'repeat-cond':
      return renderHexagon(node, theme);
    case 'if-merge':
      return '';
    case 'note':
      return renderNote(node, theme);
    default: {
      // Unknown kind: render a plain rect as a fallback
      const c = actColors(theme);
      return rect(node.x, node.y, node.width, node.height, {
        fill: c.nodeFill,
        stroke: c.nodeBorder,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Edge renderer
// ---------------------------------------------------------------------------
