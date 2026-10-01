/**
 * Activity node-shape rendering: per-shape SVG emitters (start/stop/end,
 * action, bar, diamond, chevrons, hexagon, parallelogram, note) plus the
 * renderNode dispatcher and shared label/color helpers. Split out of
 * `renderer.ts` (line cap); text `x` math lives in `activity-text-placement`.
 */

import type { ActivityNodeGeo } from './layout/tile-layout.js';
import type { Theme } from '../../core/theme.js';
import type {} from '../../core/dispatcher.js';
import { rect, diamond, noteBox, line, path, polygon } from '../../core/svg.js';
import { renderNodeLabel } from '../../core/latex.js';
import { drawActivityText, drawActivityTextLines, type ActivityTextStyle } from './activity-renderer-text.js';
import { NOTE_FOLD } from './activity-layout-constants.js';
import {
  ACTIVITY_BAR_FILL,
  CIRCLE_INK,
  NOTE_LINE_THICKNESS,
  activityFontSize,
  activityLineThickness,
  activityRoundCorner,
} from './activity-style-defaults.js';
import { activityFontColor } from './activity-text-style.js';
import { renderBar, renderSplitLine } from './activity-renderer-bars.js';
import { renderIfMerge, renderIfLabel } from './activity-renderer-if-shapes.js';
import {
  renderSignalLabel,
  renderChevronLeft,
  renderChevronRight,
  renderParallelogram,
} from './activity-renderer-signal-shapes.js';
import { renderStart, renderStop, renderKill, renderEnd } from './activity-renderer-terminals.js';
import {
  type ActivityTextOpts,
  activityTextLineX,
  centeredLineX,
  measureLineWidth,
  measureMonoLineWidth,
} from './activity-text-placement.js';

// Pure-move re-export (500-line split, T2): keeps `activity-renderer-shapes.js`
// importers of these four symbols working unchanged.
export { renderSignalLabel, renderChevronLeft, renderChevronRight, renderParallelogram };
// Pure-move re-export (500-line split, T1c): the terminal-circle renderers
// now live in `activity-renderer-terminals.ts`, which imports `actColors`
// BACK from this file (same circular-but-safe shape as the signal-shapes
// re-export above) -- existing importers of these four names are unchanged.
export { renderStart, renderStop, renderKill, renderEnd };
/** `rx`/`ry` are each HALF the resolved `RoundCorner` (`URectangle#build()
 *  .rounded()`'s halving, D4). `activityDiagram { activity { RoundCorner
 *  25 } }` (plantuml.skin:362) makes both axes 12.5 -- was a bare unsourced
 *  `rx = 8` with no `ry` at all. */
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
export const ASCENT_FRACTION = 1 - 1 / 4.5;

/**
 * One `<text>` element PER LINE, never `<tspan>` (D3). Upstream draws a
 * multi-line label as N separate `<text>` draws; `<tspan>` is reserved for
 * creole's own multi-STYLE-run serialisation within a single line
 * (`src/core/creole-svg.ts`, not this function's concern -- none of this
 * file's multi-line call sites carry creole markup, only `\n`-split text).
 */
export function textLines(
  lines: readonly string[],
  x: number,
  firstBaselineY: number,
  lineHeight: number,
  style: ActivityTextStyle,
): string {
  return drawActivityTextLines(lines, x, firstBaselineY, lineHeight, style);
}

/** First baseline Y so an N-line block is vertically centred around `cy`,
 *  using the cited advance/ascent above instead of the old `lh * 0.8`.
 *  `lineCount = 1` is this same formula's reduction to a SINGLE centred
 *  line (`cy + lineHeight * (ASCENT_FRACTION - 1/2)`) -- jar-verified
 *  against `rerovo-62-nazo755`'s hexagon label (`cy=27`, `fontSize=11`:
 *  jar `y=30.056`, exactly `27 + 11 * 5/18`) and `rarodo-65-fudu505`'s
 *  action-box label once expressed relative to `rect.y` (D1, exported for
 *  `renderer.ts`'s edge-label use, which centres on the same formula). */
export function centeredFirstBaselineY(cy: number, lineHeight: number, lineCount: number): number {
  return cy - (lineHeight * lineCount) / 2 + lineHeight * ASCENT_FRACTION;
}

/** `fontSize` defaults to the action box's size (`gtile-action.ts`); a
 *  DIFFERENT element passes its own. `opts` (`activity-text-placement.ts`)
 *  picks both the D3 colour bucket and the D2 `x` (LEFT/CENTER/RIGHT for
 *  `'activity'`, geometric centre for `'diamond'`). Only a `<latex>` label
 *  still delegates to `core/latex.ts#renderNodeLabel` -- a permanent LaTeX
 *  divergence (KaTeX, not JLaTeXMath), the sole exception here. */
export function renderLabel(label: string, cx: number, cy: number, theme: Theme, opts: ActivityTextOpts): string {
  const size = opts.fontSize ?? activityFontSize(theme, 'activity');
  if (label.includes('<latex>')) return renderNodeLabel(label, cx, cy, theme, size);
  const lineWidth = measureLineWidth(theme, size, label);
  const x = activityTextLineX(theme, cx, lineWidth, opts);
  return drawActivityText(x, cy, label, {
    fontFamily: theme.fontFamily,
    fontSize: size,
    fill: activityFontColor(theme, opts.sname),
  });
}

export function renderMultilineText(
  lines: string[],
  cx: number,
  cy: number,
  theme: Theme,
  opts: ActivityTextOpts,
): string {
  const size = opts.fontSize ?? activityFontSize(theme, 'activity');
  const y = centeredFirstBaselineY(cy, size, lines.length);
  const fill = activityFontColor(theme, opts.sname);
  return lines
    .map((ln, i) => {
      const lineWidth = measureLineWidth(theme, size, ln);
      const x = activityTextLineX(theme, cx, lineWidth, opts);
      return drawActivityText(x, y + size * i, ln, { fontFamily: theme.fontFamily, fontSize: size, fill });
    })
    .join('');
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
    // `activityBar { BackgroundColor #5 }` (plantuml.skin:387, D4).
    barFill: act?.barColor ?? ACTIVITY_BAR_FILL,
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
// `renderStart`/`renderStop`/`renderKill`/`renderEnd` live in
// `activity-renderer-terminals.ts` (T1c, 500-line hook) -- re-exported
// above.

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
  const opts: ActivityTextOpts = { sname: 'activity', fontSize: actionSize, width: node.width };

  // <code>...</code> block: monospace, measured like `gtile-action.ts`'s
  // own `monoCharWidth` sizing, not the proportional table `opts` reads.
  const codeMatch = CODE_BLOCK_RE.exec(label.trim());
  if (codeMatch !== null) {
    const codeContent = codeMatch[1]!.replace(/^\n/, '').replace(/\n$/, '');
    const codeLines = codeContent.split('\n');
    const lineY = centeredFirstBaselineY(cy, actionSize, codeLines.length);
    const codeFill = activityFontColor(theme, 'activity');
    const labelText = codeLines
      .map((ln, i) => {
        const w = measureMonoLineWidth(actionSize, ln);
        const x = activityTextLineX(theme, cx, w, opts);
        return drawActivityText(x, lineY + actionSize * i, ln, {
          fontFamily: 'monospace',
          fontSize: actionSize,
          fill: codeFill,
        });
      })
      .join('');
    return box + labelText;
  }

  const lines = label.split('\n');
  // D1/D9: the single-line baseline is the N=1 case of the SAME
  // `centeredFirstBaselineY` the multi-line branch already uses, not the
  // old `cy + actionSize / 3` hand-rounding (`rarodo-65-fudu505`: box
  // `rect.y + 19.333` reduces to `cy + actionSize * 5/18` here, not
  // `cy + actionSize/3` -- a 0.667px error at `actionSize=12`).
  const labelEl =
    lines.length > 1
      ? renderMultilineText(lines, cx, cy, theme, opts)
      : renderLabel(label, cx, centeredFirstBaselineY(cy, actionSize, 1), theme, opts);
  return box + labelEl;
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
  // `activityDiagram { diamond { FontSize 11 } }` (plantuml.skin:370), the
  // same value `tiles/gtile-diamond.ts` measured it at. `x` is
  // `FtileDiamondInside.java:94-96`'s `lx = (dimTotal.width -
  // dimLabel.width) / 2` in this node's own frame.
  const fontSize = activityFontSize(theme, 'diamond');
  const lineWidth = measureLineWidth(theme, fontSize, node.label);
  // D1: no `dominant-baseline` (the driver emits none, and no cached jar
  // SVG carries one) -- the real baseline is the same N=1 reduction of
  // `centeredFirstBaselineY` `renderHexagon`'s single-line branch uses.
  const label = drawActivityText(centeredLineX(cx, lineWidth), centeredFirstBaselineY(cy, fontSize, 1), node.label, {
    fontFamily: theme.fontFamily,
    fontSize,
    fill: activityFontColor(theme, 'diamond'),
  });
  return shape + label;
}

/** The hexagon condition label, split out of {@link renderHexagon} to stay
 *  under this file's per-function NLOC limit. Multi-line: `GtileIfHexagon
 *  .java:184`/`GtileHexagonInside.java:64` resolve `of(root, element,
 *  activityDiagram, activity, diamond)`, the diamond SName (`FontSize 11`,
 *  plantuml.skin:370). Single-line: jar-verified on `rerovo-62-nazo755`'s
 *  "test" hexagon (`cy=27`, `fontSize=11`): `y=30.056 === cy + 11 * 5/18`,
 *  the SAME N=1 reduction of `centeredFirstBaselineY` -- not the old
 *  `cy + condSize/3` (would give 30.667, 0.611px off). */
function renderHexagonLabel(label: string | undefined, cx: number, cy: number, theme: Theme, condSize: number): string {
  const lines = (label ?? '').split('\n');
  const opts: ActivityTextOpts = { sname: 'diamond', fontSize: condSize };
  return lines.length > 1
    ? renderMultilineText(lines, cx, cy, theme, opts)
    : renderLabel(label ?? '', cx, centeredFirstBaselineY(cy, condSize, 1), theme, opts);
}

export function renderHexagon(node: ActivityNodeGeo, theme: Theme): string {
  const { x, y, width: w, height: h } = node;
  const c = actColors(theme);
  const fill = node.color ?? c.diamondFill;
  const dent = h / 2;
  // `Hexagon.asPolygon(shadowing, width, height)` (`Hexagon.java:65-74`)
  // calls `addPoint` SEVEN times, re-adding the first point `(hexagonHalf
  // Size, 0)` as the closing point after `(0, height/2)`
  // (`Hexagon.java:68,74`) -- `UPolygon` does not close itself on draw
  // (T2f mechanism 1, same as {@link renderIfMerge}).
  const first = { x: x + dent, y: y };
  const shape = polygon(
    [
      first,
      { x: x + w - dent, y: y },
      { x: x + w, y: y + h / 2 },
      { x: x + w - dent, y: y + h },
      { x: x + dent, y: y + h },
      { x: x, y: y + h / 2 },
      first,
    ],
    { fill, stroke: c.diamondBorder, strokeWidth: activityLineThickness(theme, 'diamond') },
  );
  const cx = x + w / 2;
  const cy = y + h / 2;
  const condSize = activityFontSize(theme, 'diamond');
  return shape + renderHexagonLabel(node.label, cx, cy, theme, condSize);
}

export function renderNote(node: ActivityNodeGeo, theme: Theme): string {
  const { x, y, width: w, height: h } = node;
  const noteFill = theme.colors.noteBackground;
  const stroke = theme.colors.border;
  // The ROOT `note { FontSize 13; LineThickness 0.5 }` block (plantuml.skin
  // :323,325): an activity note resolves `SName.note` under `activityDiagram`
  // (`FtileWithNoteOpale.java:89`, `FtileNoteAlone.java:77`), which declares
  // no `note` override, so root stands -- the size `gtile-note.ts` measured.
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
  // `Opale.java:56` -- `marginX1 = 6`; `:127` --
  // `textBlock.drawU(ug.apply(new UTranslate(marginX1, marginY)))`. Was an
  // unsourced `x + 4`.
  const labelX = x + 6;
  let labelEl: string;
  if (lines.length > 1) {
    labelEl = textLines(lines, labelX, y + NOTE_FOLD + noteSize, noteSize, {
      fontFamily: theme.fontFamily,
      fontSize: noteSize,
      fill: activityFontColor(theme, 'note'),
    });
  } else {
    labelEl = drawActivityText(labelX, y + NOTE_FOLD + noteSize, label, {
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
      return renderStop(node, theme);
    case 'kill':
      return renderKill(node, theme);
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
    // #lizard forgives -- one dispatch arm per node kind (D4).
    case 'fork-bar':
    case 'join-bar':
      return renderBar(node, theme);
    case 'split-bar':
    case 'split-join-bar':
      return renderSplitLine(node, theme);
    case 'if-split':
    case 'while-header':
      return node.label !== undefined && node.label !== '' ? renderHexagon(node, theme) : renderDiamond(node, theme);
    case 'repeat-cond':
      return renderHexagon(node, theme);
    case 'if-merge':
      return renderIfMerge(node, theme);
    case 'if-label':
      return renderIfLabel(node, theme);
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
