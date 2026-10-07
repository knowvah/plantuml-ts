/**
 * Activity node-shape rendering: per-shape SVG emitters (start/stop/end,
 * action, bar, diamond, chevrons, hexagon, parallelogram, note) plus the
 * renderNode dispatcher and shared label/color helpers. Split out of
 * `renderer.ts` (line cap); text `x` math lives in `activity-text-placement`.
 */

import type { ActivityNodeGeo } from './layout/tile-layout.js';
import type { Theme } from '../../core/theme.js';
import type { Paint } from '../../core/paint.js';
import type {} from '../../core/dispatcher.js';
import { rect, path, polygon } from '../../core/svg.js';
import { renderNodeLabel } from '../../core/latex.js';
import {
  drawActivityText,
  drawActivityTextLines,
  renderCreoleTableGrid,
  type ActivityTextStyle,
} from './activity-renderer-text.js';
import { renderComposite as renderCompositeFrame } from './activity-renderer-composite.js';
import { NOTE_MARGIN_Y } from './activity-layout-constants.js';
import {
  noteFoldPath,
  noteBodyNormal,
  noteBodySpikeRight,
  noteBodySpikeLeft,
  noteFillOf,
} from './activity-renderer-note-shapes.js';
import { HEXAGON_HALF_SIZE } from './layout/hexagon-reservations.js'; // Hexagon.java:46
import {
  ACTIVITY_BAR_FILL,
  CIRCLE_INK,
  NOTE_LINE_THICKNESS,
  activityFontSize,
  activityLineThickness,
  activityRoundCorner,
} from './activity-style-defaults.js';
import { activityFontColor, activityFontFamily, linkStyleFields } from './activity-text-style.js';
import { renderBar, renderSplitLine } from './activity-renderer-bars.js';
import {
  renderIfMerge,
  renderIfLabel,
  renderDiamond,
  renderHexagonPolygon,
  renderHexagonOwnLabel,
  renderHexagonMultilineLabel,
  diamondLineWidth,
  renderIfSplitShape,
  diamondColors,
} from './activity-renderer-if-shapes.js';
import {
  renderSignalLabel,
  renderChevronLeft,
  renderChevronRight,
  renderParallelogram,
} from './activity-renderer-signal-shapes.js';
import { renderStart, renderStop, renderEnd, renderSpot } from './activity-renderer-terminals.js';
import { type ActivityTextOpts, activityTextLineX, measureLineWidth } from './activity-text-placement.js';
import { renderActionCodeBlock } from './activity-renderer-action-code.js';
import { floorActionLineHeight } from './tiles/gtile-action.js';
import { actionLines, centeredBaselines, actionRuleFields } from './activity-renderer-line-heights.js';
import { renderActionLabel, renderNoteLabel } from './activity-creole-sheet.js';

// Pure-move re-exports (500-line splits T2/T1c/T3f): these symbols now live
// in `activity-renderer-signal-shapes.ts`/`activity-renderer-terminals.ts`/
// `activity-renderer-if-shapes.ts` respectively, each importing `actColors`/
// `centeredFirstBaselineY` BACK from this file (safe circularity: function
// definitions only, never called at module-load time) -- existing importers
// of these names are unchanged.
export { renderSignalLabel, renderChevronLeft, renderChevronRight, renderParallelogram };
export { renderStart, renderStop, renderEnd, renderSpot };
export { renderDiamond };
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

/** add4-T2d (KLIMT-FLOOR, `loxija-71-joku558`): a diamond label line is an
 *  `AtomText` whose block height is floored at 10 (`AtomText.java:179-181`,
 *  `if (h < 10) h = 10`) while its baseline stays at the RAW `rect.height -
 *  descent` (`AtomText.java:213-215`), and `FtileDiamondInside#drawU` centres
 *  the floored block (`ly = (dimTotal.height - dimLabel.height) / 2`,
 *  `FtileDiamondInside.java:94-96`). So the first baseline is `cy -
 *  N * max(size, 10) / 2 + size * ASCENT_FRACTION`; identical to
 *  {@link centeredFirstBaselineY} for every `size >= 10`. */
export function flooredFirstBaselineY(cy: number, fontSize: number, lineCount: number): number {
  return cy - (floorActionLineHeight(fontSize) * lineCount) / 2 + fontSize * ASCENT_FRACTION;
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
  // add4-T2d: a diamond label centres on its creole width (`diamondLineWidth`).
  const lineWidth =
    opts.sname === 'diamond' ? diamondLineWidth(theme, size, label) : measureLineWidth(theme, size, label);
  const x = activityTextLineX(theme, cx, lineWidth, opts);
  // add2 T3h: family K + F (pekuxe-00/gaxezi-48/nisexe-68/dozaxu-98).
  return drawActivityText(x, cy, label, {
    fontFamily: activityFontFamily(theme, opts.sname),
    fontSize: size,
    fill: activityFontColor(theme, opts.sname),
    ...linkStyleFields(theme),
    floorCoordinated: opts.sname === 'activity',
  });
}

/** KLIMT-FLOOR/KLIMT-ACT/STRIPE: `'activity'` ONLY gets heterogeneous
 *  per-line baselines ({@link actionLines}/{@link centeredBaselines}) --
 *  a heading/floor/HR cascade each grow/shrink/reclassify ONE line
 *  (`GtileDiamond`'s sizer has none yet, ALIGN-DIAMOND unassigned; every
 *  other sname keeps its prior closed form). `ruleWidth` rides
 *  `ActivityTextStyle` so a per-line HR draws its real rule(s). */
export function renderMultilineText(
  lines: string[],
  cx: number,
  cy: number,
  theme: Theme,
  opts: ActivityTextOpts,
): string {
  const size = opts.fontSize ?? activityFontSize(theme, 'activity');
  const isAction = opts.sname === 'activity';
  const baselines = isAction
    ? centeredBaselines(cy, actionLines(lines, theme, size))
    : lines.map((_, i) => centeredFirstBaselineY(cy, size, lines.length) + size * i);
  const fill = activityFontColor(theme, opts.sname);
  // add2 T3h, families K/F -- see renderLabel's own doc comment above.
  const fontFamily = activityFontFamily(theme, opts.sname);
  const link = linkStyleFields(theme);
  const ruleFields = isAction ? actionRuleFields(cx, opts.width, actColors(theme).nodeBorder) : {};
  return lines
    .map((ln, i) => {
      const lineWidth = measureLineWidth(theme, size, ln);
      const x = activityTextLineX(theme, cx, lineWidth, opts);
      return drawActivityText(x, baselines[i]!, ln, {
        fontFamily,
        fontSize: size,
        fill,
        ...link,
        floorCoordinated: isAction,
        ...ruleFields,
      });
    })
    .join('');
}

// ---------------------------------------------------------------------------
// Activity-specific color resolution
// ---------------------------------------------------------------------------

export interface ActivityColors {
  nodeFill: Paint; // add2 T3h (family PAINT): gradients, not solid-only
  nodeBorder: string;
  barFill: string;
  startFill: string;
  endFill: string;
  diamondFill: Paint; // shares activityBackground's fallback tier
  diamondBorder: string;
}

export function actColors(theme: Theme): ActivityColors {
  const act = theme.colors.graph.activity;
  return {
    nodeFill: act?.background ?? theme.colors.nodeBackground,
    nodeBorder: act?.border ?? theme.colors.border,
    // `activityBar { BackgroundColor #5 }` (plantuml.skin:387, D4).
    barFill: act?.barColor ?? ACTIVITY_BAR_FILL,
    // `circle { start,stop,end { LineColor #2; BackgroundColor #2 } } }`
    // (plantuml.skin:379-380) -- SAME token for stroke/fill, `#2` resolved
    // through the ported `HColorSet` digit-length parser (D5). A user's
    // `skinparam ActivityStartColor` still wins (last tier, not first).
    startFill: act?.startColor ?? CIRCLE_INK,
    endFill: act?.endColor ?? CIRCLE_INK,
    diamondFill: diamondColors(act, theme).fill,
    diamondBorder: diamondColors(act, theme).border,
  };
}

// ---------------------------------------------------------------------------
// Node shape renderers
// ---------------------------------------------------------------------------
// `renderStart`/`renderStop`/`renderEnd` live in
// `activity-renderer-terminals.ts` (T1c, 500-line hook) -- re-exported
// above.

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
  const floored = floorActionLineHeight(actionSize);

  // <code>...</code> block: KLIMT-FLOOR applies too, hence `floored`.
  const codeText = renderActionCodeBlock({ label, theme, cx, cy, floored, actionSize, opts });
  if (codeText !== null) return box + codeText;

  // D5 Sheet spike (`FtileBox.java:178-181`); `renderActionLabel` doc.
  const sheetText = renderActionLabel(label, theme, actionSize, node);
  if (sheetText !== null) return box + sheetText;

  const lines = label.split('\n');
  // D1/D9: the single-line baseline is the N=1 case of the SAME
  // `centeredFirstBaselineY` the multi-line branch already uses, not the
  // old `cy + actionSize / 3` hand-rounding (`rarodo-65-fudu505`: box
  // `rect.y + 19.333` reduces to `cy + actionSize * 5/18` here, not
  // `cy + actionSize/3` -- a 0.667px error at `actionSize=12`).
  const labelEl =
    lines.length > 1
      ? renderMultilineText(lines, cx, cy, theme, opts)
      : renderLabel(label, cx, centeredFirstBaselineY(cy, floored, 1), theme, opts);
  return box + labelEl + renderCreoleTableGrid(node, lines, actionSize, theme);
}

/** The hexagon condition label, split out of {@link renderHexagon} to stay
 *  under this file's per-function NLOC limit. Single-line: jar-verified on
 *  `rerovo-62-nazo755`'s "test" hexagon (`cy=27`, `fontSize=11`):
 *  `y=30.056 === cy + 11 * 5/18`, the N=1 reduction of
 *  `centeredFirstBaselineY`. Multi-line: {@link renderHexagonMultilineLabel}
 *  (`activity-renderer-if-shapes.ts`, also at this file's own 500-line cap,
 *  IFNL/T3d doc). Exported (T3k) so that file's `renderHexagonOwnLabel` can
 *  draw the own label separately. */
export function renderHexagonLabel(
  label: string | undefined,
  cx: number,
  cy: number,
  theme: Theme,
  condSize: number,
): string {
  const lines = (label ?? '').split('\n');
  const opts: ActivityTextOpts = { sname: 'diamond', fontSize: condSize };
  return lines.length > 1
    ? renderHexagonMultilineLabel(lines, cx, cy, theme, opts)
    : renderLabel(label ?? '', cx, flooredFirstBaselineY(cy, condSize, 1), theme, opts);
}

export function renderHexagon(node: ActivityNodeGeo, theme: Theme): string {
  const { x, y, width: w, height: h } = node;
  const c = actColors(theme);
  const fill = node.color ?? c.diamondFill;
  // I (T3d): the dent is the FIXED `hexagonHalfSize` (12), not `height/2`
  // -- equal only when h=24 (default). `asPolygon(shadowing,w,h)`
  // (`Hexagon.java:46,65-74`) re-adds `(dent,0)` as the closing point
  // after `(0,h/2)` -- `UPolygon` does not close itself on draw.
  const dent = HEXAGON_HALF_SIZE;
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
  const noteFill = noteFillOf(node, theme); // add4-T1c: a note's own `#color`
  const stroke = theme.colors.border;
  // The ROOT `note { FontSize 13; LineThickness 0.5 }` block (plantuml.skin
  // :323,325): an activity note resolves `SName.note` under `activityDiagram`
  // (`FtileWithNoteOpale.java:89`, `FtileNoteAlone.java:77`), which declares
  // no `note` override, so root stands -- the size `gtile-note.ts` measured.
  const noteSize = activityFontSize(theme, 'note');
  const spike = node.spikeTip;
  const paint = { fill: noteFill, stroke, strokeWidth: NOTE_LINE_THICKNESS };
  // `node.notePosition === 'left'` means the NOTE sits left of its target,
  // so the spike protrudes from the note's RIGHT edge (`getPolygonRight`);
  // `'right'` is the mirror (`getPolygonLeft`, spike on the LEFT edge).
  let bodyD: string;
  if (spike !== undefined && node.notePosition === 'left') {
    bodyD = noteBodySpikeRight(x, y, w, h, spike);
  } else if (spike !== undefined && node.notePosition === 'right') {
    bodyD = noteBodySpikeLeft(x, y, w, h, spike);
  } else {
    bodyD = noteBodyNormal(x, y, w, h);
  }
  // `Opale#drawU` (`:126`) draws the fold as its OWN filled `<path>`
  // unconditionally -- same shape whether or not the note has a spike.
  const body = path(bodyD, paint) + path(noteFoldPath(x, y, w), paint);

  const label = node.label ?? '';

  // add3-T3d: `FtileWithNoteOpale.java:147-150` draws via the real creole
  // Sheet -- `renderNoteLabel`'s own doc (geometric fallback for a note
  // NOT sized by the matching `measureOpaleCreole`, e.g. NOTE-MULTI).
  const sheetLabel = renderNoteLabel(label, theme, { x, y, width: w, height: h }, stroke);
  if (sheetLabel !== null) return body + sheetLabel;

  const lines = label.split('\n');
  // `Opale.java:56` -- `marginX1 = 6`; `:127` --
  // `textBlock.drawU(ug.apply(new UTranslate(marginX1, marginY)))`. Was an
  // unsourced `x + 4`.
  const labelX = x + 6;
  // `Opale.java:58`'s `marginY = 5` is the text BLOCK's own top inset; the
  // first line's baseline is that same ascent-based reduction every other
  // single/multi-line label in this file uses (`ASCENT_FRACTION`, D1/D9) --
  // not the old unsourced `NOTE_FOLD` reuse, which put the baseline 5.889px
  // low on a single-line note (T2f mechanism 3, `volefo-41-tolo996`).
  const firstBaselineY = y + NOTE_MARGIN_Y + noteSize * ASCENT_FRACTION;
  const textStyle = {
    fontFamily: activityFontFamily(theme, 'note'),
    fontSize: noteSize,
    fill: activityFontColor(theme, 'note'),
  };
  const labelEl =
    lines.length > 1
      ? textLines(lines, labelX, firstBaselineY, noteSize, textStyle)
      : drawActivityText(labelX, firstBaselineY, label, textStyle);
  return body + labelEl;
}

/** The root `composite { LineColor black; BackgroundColor transparent;
 *  LineThickness 1.5 }` block (`plantuml.skin:364-368`) -- a `partition`/
 *  `package`/`rectangle`/`card`/`group` frame (`group-dispatch.ts`'s
 *  `GROUP_TYPES`, all mapped to ONE `composite` SName by `FromSkinparam
 *  ToStyle.java:131-132`'s `PartitionBorderColor`/`PartitionBackground
 *  Color` converts). `node.kind` had no case here at all, so every group/
 *  partition fell through `renderNode`'s `default:` fallback and drew the
 *  generic node fill/border instead (T2f mechanism 6, `caciva-80-
 *  kene990`: ours `fill="#F1F1F1" stroke="#181818"`, jar `fill="none"
 *  stroke="#000"`). No `skinparam Partition*Color` override hook exists
 *  yet (would need a `core/theme-graph-colors-b.ts` field, out of this
 *  task's write-set) -- the plain default is drawn unconditionally, which
 *  is also what every cohort row needs (none sets that skinparam).
 *  T3g (family PART): the title tab + text now draw too, ported in
 *  `activity-renderer-composite.ts` (this file was at the line cap) --
 *  this is a one-line delegate so existing callers are unchanged. */
function renderComposite(node: ActivityNodeGeo, theme: Theme): string {
  return renderCompositeFrame(node, theme);
}

export function renderNode(node: ActivityNodeGeo, theme: Theme): string {
  switch (node.kind) {
    case 'start':
      return renderStart(node, theme);
    case 'stop':
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
    // #lizard forgives -- one dispatch arm per node kind (D4).
    case 'fork-bar':
    case 'join-bar':
      return renderBar(node, theme);
    case 'split-bar':
    case 'split-join-bar':
      return renderSplitLine(node, theme);
    case 'if-split':
    case 'repeat-cond':
      // T3k/add3-T3c: see `renderIfSplitShape`'s own doc comment
      // (`activity-renderer-if-shapes.ts`, split out there to keep this
      // function under the file's complexity cap).
      return renderIfSplitShape(node, theme);
    case 'while-header':
      // `FtileWhile.create` picks diamond1 by conditionStyle exactly as an
      // if does: INSIDE_HEXAGON -> FtileDiamondInside, INSIDE_DIAMOND ->
      // FtileDiamondSquare, EMPTY_DIAMOND -> FtileDiamond
      // (`vcompact/FtileWhile.java:130-140`); same shape dispatch as above.
      return renderIfSplitShape(node, theme);
    case 'if-merge':
      // add4-T2d: a switch's diamond2 is an `FtileDiamondInside` hexagon
      // (`FtileFactoryDelegatorSwitch.java:159-160`), not `FtileDiamond`'s
      // rhombus -- `walk-switch.ts#SWITCH_DIAMOND_SHAPE`.
      return node.diamondShape === 'inside' ? renderHexagonPolygon(node, theme) : renderIfMerge(node, theme);
    case 'if-label':
      return renderIfLabel(node, theme);
    case 'if-own-label':
      return renderHexagonOwnLabel(node, theme);
    case 'note':
      return renderNote(node, theme);
    case 'group':
    case 'partition':
      return renderComposite(node, theme);
    case 'spot':
      return renderSpot(node, theme);
    case 'label': // `FtileEmpty#drawU` is empty -- `ast.ts`'s own doc.
    case 'goto':
      return '';
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
